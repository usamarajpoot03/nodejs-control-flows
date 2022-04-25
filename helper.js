module.exports = {
    // will add https && www by default for urls which does't mention protocol
    fixUrls(urls) {
        const fixedUrls = [];
        for (const url of urls) {
            let defaultProtocol = 'https://';
            if (url.startsWith('http:'))
                defaultProtocol = 'http://';
            const withOutPrefix = url.replace(defaultProtocol, '').replace('www.', '');
            fixedUrls.push(defaultProtocol + 'www.' + withOutPrefix);
        }
        return fixedUrls;
    }
}