export const smartUserAgent = (useragent:string) => {
    const v = '0.4.315';
    useragent = useragent.replace(useragent.match(/\(([^()]*)\)/g).find(x=>x.toLowerCase().includes('linux')||x.toLowerCase().includes('windows')),'(Macintosh; Intel Mac OS X 10_15_2)')
    if(!useragent.includes('WhatsApp')) return `WhatsApp/${v} ${useragent}`;
    return useragent.replace(useragent.match(/WhatsApp\/([.\d])*/g)[0].match(/[.\d]*/g).find(x=>x),v);
}