const logger = {
    info: (message: string) => console.log(`[INFO] ${message}`),
    debug: (message: string) => console.log(`[DEBUG] ${message}`),
    error: (message: string) => console.error(`[ERROR] ${message}`),
};


export class VerifierResponse {
    constructor(
        public code: number,
        public message: string,
        public body: any
    ) {}
}


class VerifierServiceAdapter {
    private verifierBaseUrl: string;
    private authsUrl: string;
    private presentationsUrl: string;
    private verifySignedHeadersUrl: string;
    private verifySignatureUrl: string;
    private addRotUrl: string;

    constructor(verifierBaseUrl: string = "http://localhost:7676") {
        this.verifierBaseUrl = verifierBaseUrl;
        this.authsUrl = `${this.verifierBaseUrl}/authorizations/`;
        this.presentationsUrl = `${this.verifierBaseUrl}/presentations/`;
        this.verifySignedHeadersUrl = `${this.verifierBaseUrl}/request/verify/`;
        this.verifySignatureUrl = `${this.verifierBaseUrl}/signature/verify/`;
        this.addRotUrl = `${this.verifierBaseUrl}/root_of_trust/`;
    }

    async checkLoginRequest(aid: string): Promise<Response> {
        logger.info(`Check login request sent with: aid = ${aid}`);
        const heads = new Headers();
        heads.set("Content-Type", "application/json");
        const url = `${this.authsUrl}${aid}`;
        const res = await fetch(url, {
            headers: heads,
            method: "GET",
        });
        return res;
    }

    async credentialPresentationRequest(said: string, vlei: string): Promise<Response> {
        logger.info(`Credential presentation request sent with: said = ${said}`);
        const heads = new Headers();
        heads.set("Content-Type", "application/json+cesr");
        const url = `${this.presentationsUrl}${said}`;
        const res = await fetch(url, {
            headers: heads,
            method: "PUT",
            body: vlei,
        });
        return res;
    }

    async verifySignedHeadersRequest(aid: string, sig: string, ser: string): Promise<Response> {
        logger.info(`Signed headers verification request sent with aid = ${aid}, sig = ${sig}, ser = ${ser}`);
        const url = `${this.verifySignedHeadersUrl}${aid}?sig=${sig}&data=${ser}`;
        const res = await fetch(url, {
            method: "POST",
        });
        return res;
    }

    async verifySignatureRequest(signature: string, signerAid: string, nonPrefixedDigest: string): Promise<Response> {
        logger.info(`Signature verification request sent with signature = ${signature}, submitter = ${signerAid}, digest = ${nonPrefixedDigest}`);
        const heads = new Headers();
        heads.set("Content-Type", "application/json");
        const url = this.verifySignatureUrl;
        const payload = {
            signature,
            signer_aid: signerAid,
            non_prefixed_digest: nonPrefixedDigest,
        };
        const res = await fetch(url, {
            headers: heads,
            method: "POST",
            body: JSON.stringify(payload),
        });
        return res;
    }

    async addRootOfTrustRequest(aid: string, vlei: string, oobi: string): Promise<Response> {
        logger.info(`Add root of trust request sent with: aid = ${aid}, vlei = ${vlei}, oobi = ${oobi}`);
        const heads = new Headers();
        heads.set("Content-Type", "application/json");
        const url = `${this.addRotUrl}${aid}`;
        const payload = { vlei, oobi };
        const res = await fetch(url, {
            headers: heads,
            method: "POST",
            body: JSON.stringify(payload),
        });
        return res;
    }
}


export class VerifierClient {
    private verifierServiceAdapter: VerifierServiceAdapter;

    constructor(verifierBaseUrl: string = "http://localhost:7676") {
        this.verifierServiceAdapter = new VerifierServiceAdapter(verifierBaseUrl);
    }

    async checkLogin(aid: string): Promise<VerifierResponse> {
        const res = await this.verifierServiceAdapter.checkLoginRequest(aid);
        const data = await res.json();
        return new VerifierResponse(res.status, data.msg, data);
    }

    async login(said: string, vlei: string): Promise<VerifierResponse> {
        const res = await this.verifierServiceAdapter.credentialPresentationRequest(said, vlei);
        const data = await res.json();
        return new VerifierResponse(res.status, data.msg, data);
    }

    async verifySignedHeaders(aid: string, sig: string, ser: string): Promise<VerifierResponse> {
        const res = await this.verifierServiceAdapter.verifySignedHeadersRequest(aid, sig, ser);
        const data = await res.json();
        return new VerifierResponse(res.status, data.msg, data);
    }

    async addRootOfTrust(aid: string, vlei: string, oobi: string): Promise<VerifierResponse> {
        const res = await this.verifierServiceAdapter.addRootOfTrustRequest(aid, vlei, oobi);
        const data = await res.json();
        return new VerifierResponse(res.status, data.msg, data);
    }

    async verifySignature(signature: string, signerAid: string, nonPrefixedDigest: string): Promise<VerifierResponse> {
        const res = await this.verifierServiceAdapter.verifySignatureRequest(signature, signerAid, nonPrefixedDigest);
        const data = await res.json();
        return new VerifierResponse(res.status, data.msg, data);
    }
}