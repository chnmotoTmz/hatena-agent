// This will adapt logic from hatena_agent.py's WSSE auth and requests
// For now, it's a placeholder. Actual HTTP requests and WSSE need to be implemented.
import * as crypto from 'crypto';
import { Buffer } from 'buffer'; // Ensure Buffer is available for b64encode

export class HatenaClient {
    private username: string;
    private apiKey: string;
    private blogDomain: string; // e.g., your-id.hatenablog.com or blog.example.com

    constructor(username: string, apiKey: string, blogDomain: string) {
        if (!username || !apiKey || !blogDomain) {
            throw new Error("Hatena client credentials (username, apiKey, blogDomain) are required.");
        }
        this.username = username;
        this.apiKey = apiKey;
        this.blogDomain = blogDomain; // This is the full blog domain
    }

    private generateWsseHeader(): string {
        const nonce = crypto.randomBytes(16).toString('hex');
        const now = new Date().toISOString().split('.')[0] + 'Z'; // Format: YYYY-MM-DDTHH:MM:SSZ
        const passwordDigestInput = nonce + now + this.apiKey;
        const passwordDigest = crypto.createHash('sha1').update(passwordDigestInput).digest('base64');

        return `UsernameToken Username="${this.username}", PasswordDigest="${passwordDigest}", Nonce="${Buffer.from(nonce).toString('base64')}", Created="${now}"`;
    }

    // Base URL for AtomPub
    private get atomPubUrl(): string {
        // Assuming blogDomain is like "your-id.hatenablog.com" or "blog.example.com"
        // The AtomPub endpoint is typically at /atom not /username/blogDomain/atom
        // For member blogs: blog.hatena.ne.jp/username/blog_id
        // Let's assume for now the blogDomain IS the full host part including hatena specific paths if needed
        // e.g. HATENA_BLOG_ID might be "username/blogname.hatenablog.com" - this needs clarification from original python
        // The python code used: `https://blog.hatena.ne.jp/{username}/{blog_domain}/atom/entry`
        // So, blogDomain in Python was likely just the "blog id" part.
        // Let's assume blogDomain here is the "blog_id" from python's os.getenv("BLOG_DOMAIN")
        return `https://blog.hatena.ne.jp/${this.username}/${this.blogDomain}/atom`;
    }

    async get(path: string, params?: Record<string, string>): Promise<string> {
        const url = new URL(`${this.atomPubUrl}${path}`);
        if (params) {
            Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));
        }

        console.log(`[HatenaClient] GET: ${url.toString()}`);
        // Placeholder for actual fetch:
        // const response = await fetch(url.toString(), {
        //     method: 'GET',
        //     headers: { 'X-WSSE': this.generateWsseHeader() }
        // });
        // if (!response.ok) throw new Error(`Hatena API Error: ${response.status} ${await response.text()}`);
        // return await response.text();

        // Simulate Atom feed structure based on path
        if (path.startsWith('/entry/') && path.split('/').length > 2 && path.split('/')[2] !== '') {
            // Request for a single entry, e.g., /entry/10001
            const articleId = path.split('/')[2];
            // Determine which mock article to return based on ID for more realistic single fetch
            let title = `Single Article (${articleId}) from Placeholder Client`;
            let content = `This is the first sentence. This is the second sentence, which is a bit longer. Here comes the third sentence! A fourth sentence follows. The fifth sentence makes a concluding point. And a sixth one for good measure.`;
            let categoriesXml = `<category term="generic" />`;
            let draftStatus = "no";

            if (articleId === "10001") {
                title = "Tech Article 1 (Public)";
                content = "Content of tech article 1. Has keywords like API and TypeScript.";
                categoriesXml = `<category term="tech" /><category term="programming" />`;
                draftStatus = "no";
            } else if (articleId === "10002") {
                title = "Lifestyle Article (Draft)";
                content = "Content of lifestyle draft article. About travel and food.";
                categoriesXml = `<category term="lifestyle" />`;
                draftStatus = "yes";
            } else if (articleId === "10003") {
                title = "Tech Article 2 (Draft)";
                content = "Content of tech article 2, also a draft. Focus on Python.";
                categoriesXml = `<category term="tech" /><category term="python" />`;
                draftStatus = "yes";
            }

            return `<?xml version="1.0" encoding="utf-8"?>
<entry xmlns="http://www.w3.org/2005/Atom" xmlns:app="http://www.w3.org/2007/app">
  <title>${title}</title>
  <id>tag:blog.hatena.ne.jp,2023:entry/${articleId}</id>
  <link rel="alternate" type="text/html" href="http://${this.blogDomain}/entry/2023/01/01/${articleId}"/>
  <link rel="edit" href="${this.atomPubUrl}/entry/${articleId}"/>
  <published>2023-01-01T00:00:00Z</published>
  <updated>2023-01-01T00:00:00Z</updated>
  <content type="text/plain">${content}</content>
  ${categoriesXml}
  <app:control><app:draft>${draftStatus}</app:draft></app:control>
</entry>`;
        } else {
            // Request for collection (or other paths), e.g., /entry
            const nextPageLinkValue = `${this.atomPubUrl}/entry?page=nextpagetoken_from_test_client`;
            return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:app="http://www.w3.org/2007/app">
  <title>${this.blogDomain} - Test Feed</title>
  <link rel="next" href="${nextPageLinkValue}"/>
  <entry>
    <title>Tech Article 1 (Public)</title>
    <id>tag:blog.hatena.ne.jp,2023:entry/10001</id>
    <link rel="alternate" type="text/html" href="http://${this.blogDomain}/entry/2023/01/01/000000"/>
    <link rel="edit" href="${this.atomPubUrl}/entry/10001"/>
    <published>2023-01-01T00:00:00Z</published>
    <updated>2023-01-01T01:00:00Z</updated>
    <content type="text/plain">Content of tech article 1. Has keywords like API and TypeScript.</content>
    <category term="tech" />
    <category term="programming" />
    <app:control><app:draft>no</app:draft></app:control>
  </entry>
  <entry>
    <title>Lifestyle Article (Draft)</title>
    <id>tag:blog.hatena.ne.jp,2023:entry/10002</id>
    <link rel="alternate" type="text/html" href="http://${this.blogDomain}/entry/2023/01/02/000000"/>
    <link rel="edit" href="${this.atomPubUrl}/entry/10002"/>
    <published>2023-01-02T00:00:00Z</published>
    <updated>2023-01-02T01:00:00Z</updated>
    <content type="text/plain">Content of lifestyle draft article. About travel and food.</content>
    <category term="lifestyle" />
    <app:control><app:draft>yes</app:draft></app:control>
  </entry>
  <entry>
    <title>Tech Article 2 (Draft)</title>
    <id>tag:blog.hatena.ne.jp,2023:entry/10003</id>
    <link rel="alternate" type="text/html" href="http://${this.blogDomain}/entry/2023/01/03/000000"/>
    <link rel="edit" href="${this.atomPubUrl}/entry/10003"/>
    <published>2023-01-03T00:00:00Z</published>
    <updated>2023-01-03T01:00:00Z</updated>
    <content type="text/plain">Content of tech article 2, also a draft. Focus on Python.</content>
    <category term="tech" />
    <category term="python" />
    <app:control><app:draft>yes</app:draft></app:control>
  </entry>
</feed>`;
        }
    }
}
