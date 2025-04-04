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
    private statusUrl: string;

    constructor(verifierBaseUrl: string = "http://localhost:7676") {
        this.verifierBaseUrl = verifierBaseUrl;
    }

    async authorizationRequest(aid: string, request: Request): Promise<Response> {
        logger.info(`Authorization request sent with: aid = ${aid}`);
        const url = `${this.verifierBaseUrl}/authorizations/${aid}`;
        const res = await fetch(url, {
            "method": "GET",
            "headers": request.headers
        });
        return res;
    }

    private async getVerifierUrl(aid: string): Promise<string>{
        const statusResp = await fetch(`${this.verifierBaseUrl}/status/`, {method: "GET"});
        const statusJson = await statusResp.json();
        const mode = statusJson["mode"];
        if (mode == "router"){
            const getVerifierUrlResp = await fetch(`${this.verifierBaseUrl}/get_verifier_url_for_aid/${aid}`, {method: "GET"});
            const getVerifierUrlJson = await getVerifierUrlResp.json();
            const verifierUrl = getVerifierUrlJson["verifier_url"];
            return verifierUrl;
        }
        else{
            return this.verifierBaseUrl;
        }
    }

    async buildAuthorizationRequest(aid: string): Promise<{url: string, req: RequestInit}> {
        const verifierUrl = await this.getVerifierUrl(aid);
        const heads = new Headers();
        heads.set("Content-Type", "application/json");
        const url = `${verifierUrl}/authorizations/${aid}`;
        return {url: url, req: {
            headers: heads,
            method: "GET",
        }};
    }

    async presentationRequest(said: string, vlei: string): Promise<Response> {
        logger.info(`Presentation request sent with: said = ${said}`);
        const heads = new Headers();
        heads.set("Content-Type", "application/json+cesr");
        const url = `${this.verifierBaseUrl}/presentations/${said}`;
        const res = await fetch(url, {
            headers: heads,
            method: "PUT",
            body: vlei,
        });
        return res;
    }

    async verifySignedHeadersRequest(aid: string, sig: string, ser: string): Promise<Response> {
        logger.info(`Signed headers verification request sent with aid = ${aid}, sig = ${sig}, ser = ${ser}`);
        const url = `${this.verifierBaseUrl}/request/verify/${aid}?sig=${sig}&data=${ser}`;
        const res = await fetch(url, {
            method: "POST",
        });
        return res;
    }

    async verifySignatureRequest(signature: string, signerAid: string, nonPrefixedDigest: string): Promise<Response> {
        logger.info(`Signature verification request sent with signature = ${signature}, submitter = ${signerAid}, digest = ${nonPrefixedDigest}`);
        const heads = new Headers();
        heads.set("Content-Type", "application/json");
        const url = `${this.verifierBaseUrl}/signature/verify/`;
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
        const url = `${this.verifierBaseUrl}/root_of_trust/${aid}`;
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

    async authorization(aid: string, request: Request): Promise<VerifierResponse> {
        const res = await this.verifierServiceAdapter.authorizationRequest(aid, request);
        const data = await res.json();
        return new VerifierResponse(res.status, data.msg, data);
    }

    async buildAuthorizationRequest(aid: string){
        return await this.verifierServiceAdapter.buildAuthorizationRequest(aid);
    }

    async presentation(said: string, vlei: string): Promise<VerifierResponse> {
        const res = await this.verifierServiceAdapter.presentationRequest(said, vlei);
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