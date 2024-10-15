// export Interfaces.ts

// Define the structure of paramValues inside parameters
export interface ParamValues {
    URL_PARAMS_1: string;
    URL_PARAMS_2: string;
    URL_PARAMS_GRD: string;
    hrv: string;
    recovery_score: string;
    sleep_score: string;
    user_id: string;
}

// Define the structure of parameters (parsed from JSON string)
export interface Parameters {
    additionalClientOptions: Record<string, any>;
    body: string;
    geoLocation: string;
    headers: Record<string, any>;
    method: string;
    paramValues: ParamValues;
    responseMatches: Array<{ invert: boolean; type: string; value: string }>;
    responseRedactions: Array<{ jsonPath: string; regex: string; xPath: string }>;
    url: string;
}

// Define the structure of claimData
export interface ClaimData {
    contextAddress: string;
    contextMessage: string;
    extractedParameters: {
      URL_PARAMS_1: string;
      URL_PARAMS_2: string;
      URL_PARAMS_GRD: string;
      hrv_component: string;
      recovery_score: string;
      score: string;
    };
    providerHash: string;
  }

// Define the structure of the proofs object returned by the SDK
export interface Proof {
    identifier: string;
    claimData: ClaimData;
    signatures: string[];
    witnesses: Array<{ id: string; url: string }>;
    publicData: Record<string, any>;
}

// Define the structure of the parsed proofs to pass to the parent
export interface ParsedProofs {
    hrv: string;
    recovery_score: string;
    sleep_score: string;
    user_id: string;
}

// Define the props for ReclaimProof component
export interface ReclaimProofProps {
    onProofs: (proofs: ParsedProofs) => void;
    onError?: (error: any) => void; // Optional error callback
}
