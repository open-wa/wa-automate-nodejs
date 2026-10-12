use std::alloc::{alloc_zeroed, dealloc, Layout};
use fast_image_resize::{images::Image, PixelType, Resizer, ResizeOptions, ResizeAlg, FilterType};

#[no_mangle]
pub unsafe extern "C" fn allocate(len: usize) -> *mut u8 { alloc_zeroed(Layout::from_size_align(len, 16).unwrap()) }
#[no_mangle]
pub unsafe extern "C" fn release(ptr: *mut u8, len: usize) { dealloc(ptr, Layout::from_size_align(len,16).unwrap()); }

#[no_mangle]
pub unsafe extern "C" fn invert(src:*const u8,dst:*mut u8,len:usize) {
    let mut i=0;
    #[cfg(target_feature="simd128")]
    {
        use std::arch::wasm32::*;
        let mask=i32x4_splat(0x00ffffff);
        while i+16<=len { v128_store(dst.add(i) as *mut v128,v128_xor(v128_load(src.add(i) as *const v128),mask)); i+=16; }
    }
    while i<len { *dst.add(i)=255-*src.add(i);*dst.add(i+1)=255-*src.add(i+1);*dst.add(i+2)=255-*src.add(i+2);*dst.add(i+3)=*src.add(i+3);i+=4; }
}

#[no_mangle]
pub unsafe extern "C" fn grayscale(src:*const u8,dst:*mut u8,len:usize) {
    for i in (0..len).step_by(4) { let v=((*src.add(i) as u32*299+*src.add(i+1) as u32*587+*src.add(i+2) as u32*114+500)/1000) as u8;
        *dst.add(i)=v;*dst.add(i+1)=v;*dst.add(i+2)=v;*dst.add(i+3)=*src.add(i+3); }
}

#[no_mangle]
pub unsafe extern "C" fn stereo(src:*const u8,dst:*mut u8,w:usize,h:usize,offset:usize) {
    for y in 0..h {for x in 0..w {let p=(y*w+x)*4;
        *dst.add(p)=if x+offset<w {*src.add((y*w+x+offset)*4)}else{0};
        *dst.add(p+1)=*src.add(p+1);
        *dst.add(p+2)=if x>=offset {*src.add((y*w+x-offset)*4+2)}else{0};
        *dst.add(p+3)=*src.add(p+3);
    }}
}

unsafe fn morph_once(src:*const u8,dst:*mut u8,w:usize,h:usize,dilate:bool) {
    for y in 0..h {
        let uy=y.saturating_sub(1);let dy=(y+1).min(h-1);
        let mut x=0;
        #[cfg(target_feature="simd128")]
        if w>=6 {
            use std::arch::wasm32::*;
            for c in 0..4 {let p=(y*w)*4+c;let mut v=*src.add(p);
                for q in [(uy*w)*4+c,(dy*w)*4+c,(y*w+1)*4+c]{let a=*src.add(q);v=if dilate{v.max(a)}else{v.min(a)};}*dst.add(p)=v;}
            x=1;
            while x+4<w {
                let p=(y*w+x)*4;
                let mut v=v128_load(src.add(p) as *const v128);
                for q in [(uy*w+x)*4,(dy*w+x)*4,p-4,p+4]{let a=v128_load(src.add(q) as *const v128);v=if dilate{u8x16_max(v,a)}else{u8x16_min(v,a)};}
                v128_store(dst.add(p) as *mut v128,v);x+=4;
            }
        }
        for xx in x..w {for c in 0..4 {let p=(y*w+xx)*4+c;let mut v=*src.add(p);
            for q in [(uy*w+xx)*4+c,(dy*w+xx)*4+c,(y*w+xx.saturating_sub(1))*4+c,(y*w+(xx+1).min(w-1))*4+c]{let a=*src.add(q);v=if dilate{v.max(a)}else{v.min(a)};}*dst.add(p)=v;}}
    }
}

#[no_mangle]
pub unsafe extern "C" fn morphology(src:*const u8,dst:*mut u8,scratch:*mut u8,w:usize,h:usize,iterations:usize,dilate:bool) {
    if iterations==0 {std::ptr::copy_nonoverlapping(src,dst,w*h*4);return;}
    morph_once(src,dst,w,h,dilate);
    let mut a=dst;let mut b=scratch;
    for _ in 1..iterations {morph_once(a,b,w,h,dilate);std::mem::swap(&mut a,&mut b);}
    if a!=dst {std::ptr::copy_nonoverlapping(a,dst,w*h*4);}
}

#[no_mangle]
pub unsafe extern "C" fn bayer(src:*const u8,dst:*mut u8,w:usize,h:usize) {
    std::ptr::write_bytes(dst,0,w*h*16);
    for y in 0..h {for x in 0..w {let p=(y*w+x)*4;let a=(y*2*w*2+x*2)*4;
        *dst.add(a+2)=*src.add(p+2);*dst.add(a+4+1)=*src.add(p+1);*dst.add(a+w*8+1)=*src.add(p+1);*dst.add(a+w*8+4)=*src.add(p);
        for q in [a,a+4,a+w*8,a+w*8+4] {*dst.add(q+3)=255;}
    }}
}

#[no_mangle]
pub unsafe extern "C" fn resize(src:*const u8,dst:*mut u8,w:u32,h:u32,ow:u32,oh:u32,lanczos:bool) {
    let src_buffer=std::slice::from_raw_parts_mut(src as *mut u8,w as usize*h as usize*4);
    let src_image=Image::from_slice_u8(w,h,src_buffer,PixelType::U8x4).unwrap();
    let dst_buffer=std::slice::from_raw_parts_mut(dst,ow as usize*oh as usize*4);
    let mut dst_image=Image::from_slice_u8(ow,oh,dst_buffer,PixelType::U8x4).unwrap();
    let opts=ResizeOptions::new().resize_alg(ResizeAlg::Convolution(if lanczos {FilterType::Lanczos3}else{FilterType::Bilinear}));
    Resizer::new().resize(&src_image,&mut dst_image,&opts).unwrap();
}
