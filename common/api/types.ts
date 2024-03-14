/**
 * A narrowed type of the grype json output. This interface is not complete but encompasses all the fields used in this PoC.
 */
export interface GrypeResult {
  matches: {
    vulnerability: {
      id: string;
      severity?: string;
      cvss: {
        metrics: {
          baseScore: number;
          exploitabilityScore: number;
          impactScore: number;
        };
      }[];
      fix: {
        versions: string[];
        state: string;
      };
    };
    matchDetails: {
      type: string;
    }[];
    artifact: {
      name: string;
      version: string;
    };
  }[];
}

export type Scan = {
  id: string;
  sbomId: string;
  createdAt: string;
  status: string;
  resultHash?: string;
  result?: GrypeResult;
};

export type Scans = Omit<Scan, "result">[];

export type Sbom = {
  id: string;
  prettyName: string;
  createdAt: string;
  value: any;
};

export type Sboms = Omit<Sbom, "value">[];
