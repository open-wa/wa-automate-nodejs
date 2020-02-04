/**
 *  Use this to generate a more likely valid user agent. It makes sure it has the Whatsapp part and replaces any windows or linux os info with mac.
 * @param useragent Your custom user agent
 * @param v The whatsapp version from the debug info. This is optional. default is 0.4.315
 */
export const smartUserAgent = (useragent:string, v:string= '0.4.315') => {
    useragent = useragent.replace(useragent.match(/\(([^()]*)\)/g).find(x=>x.toLowerCase().includes('linux')||x.toLowerCase().includes('windows')),'(Macintosh; Intel Mac OS X 10_15_2)')
    if(!useragent.includes('WhatsApp')) return `WhatsApp/${v} ${useragent}`;
    return useragent.replace(useragent.match(/WhatsApp\/([.\d])*/g)[0].match(/[.\d]*/g).find(x=>x),v);
}