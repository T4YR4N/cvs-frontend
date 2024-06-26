"use client";

import apiFetch from "@/common/api/apiFetch";
import React, { useEffect, useState } from "react";
import styles from "./scan.module.css";
import mainStyles from "@/app/main.module.css";
import { Scans } from "@/common/api/types";
import sha256 from "crypto-js/sha256";
import type { GrypeResult, Scan, Sbom } from "@/common/api/types";
import { SafeNonPrimitive } from "@/common/helperTypes";
import { formatDate } from "@/common/date";

type Diff = {
  additions: {
    name: string;
    version: string;
    cve: string;
    type: string;
    severity: string;
  }[];
  removals: {
    name: string;
    version: string;
    cve: string;
    type: string;
    severity: string;
  }[];
  changes: GrypeResult["matches"];
};

const View = ({ params }: { params: { scanId: string } }) => {
  const [scan, setScan] = useState<Scan | undefined>(undefined);
  const [sbom, setSbom] = useState<Sbom | undefined>(undefined);
  const [scanOptions, setScanOptions] = useState<React.JSX.Element[]>([]);
  const [diff, setDiff] = useState<Diff>({
    additions: [],
    removals: [],
    changes: [],
  });
  const [selectedScan, setSelectedScan] = useState<Scan | undefined>(undefined);
  const [selectedScanMatch, setSelectedScanMatch] = useState<
    | {
        currentMatch: GrypeResult["matches"][number];
        selectedMatch: GrypeResult["matches"][number];
      }
    | undefined
  >(undefined);

  const sortJsonByHash = (a: SafeNonPrimitive, b: SafeNonPrimitive) => {
    const aHash = sha256(JSON.stringify(a)).toString();
    const bHash = sha256(JSON.stringify(b)).toString();

    return aHash.localeCompare(bHash);
  };

  const reducedResult = (matches: GrypeResult["matches"]) =>
    matches
      .map(({ vulnerability, matchDetails, artifact }) => ({
        vulnerability: {
          id: vulnerability.id.toLowerCase().trim(),
          severity: vulnerability.severity?.toLowerCase().trim() || "",
          cvss: vulnerability.cvss
            .map((val) => ({
              metrics: {
                baseScore: val.metrics.baseScore,
                exploitabilityScore: val.metrics.exploitabilityScore,
                impactScore: val.metrics.impactScore,
              },
            }))
            .sort(sortJsonByHash),
          fix: {
            versions: vulnerability.fix.versions
              .map((v) => v.toLowerCase().trim())
              .sort(),
            state: vulnerability.fix.state.toLowerCase().trim(),
          },
        },
        matchDetails: matchDetails
          .map((md) => ({
            type: md.type.toLowerCase().trim(),
          }))
          .sort((a, b) => a.type.localeCompare(b.type)),
        artifact: {
          name: artifact.name.toLowerCase().trim(),
          version: artifact.version.toLowerCase().trim(),
        },
      }))
      .sort(sortJsonByHash);

  const calcDiff = async (
    scanId: string,
    currentMatches: GrypeResult["matches"]
  ) => {
    if (!scanId) {
      setDiff({ additions: [], removals: [], changes: [] });
      setSelectedScan(undefined);
      return;
    }

    const getSelectedScanRes = await apiFetch<Scan>(`scans/${scanId}`);

    const selectedScanMatches =
      getSelectedScanRes.responseObject?.result?.matches || [];

    if (!getSelectedScanRes.success || !selectedScanMatches.length) return;

    setSelectedScan(getSelectedScanRes.responseObject);

    const currentMatchesReduced = reducedResult(currentMatches);
    const otherScanMatchesReduced = reducedResult(selectedScanMatches);

    const additions = currentMatchesReduced
      .filter(
        (val) =>
          otherScanMatchesReduced.findIndex(
            (val2) =>
              val2.artifact.name === val.artifact.name &&
              val2.artifact.version === val.artifact.version &&
              val2.vulnerability.id === val.vulnerability.id
          ) === -1
      )
      .map((val) => ({
        name: val.artifact.name,
        version: val.artifact.version,
        cve: val.vulnerability.id,
        type: val.matchDetails[0].type,
        severity: val.vulnerability.severity,
      }));

    const removals = otherScanMatchesReduced
      .filter(
        (val) =>
          currentMatchesReduced.findIndex(
            (val2) =>
              val2.artifact.name === val.artifact.name &&
              val2.artifact.version === val.artifact.version &&
              val2.vulnerability.id === val.vulnerability.id
          ) === -1
      )
      .map((val) => ({
        name: val.artifact.name,
        version: val.artifact.version,
        cve: val.vulnerability.id,
        type: val.matchDetails[0].type,
        severity: val.vulnerability.severity,
      }));

    const changes: GrypeResult["matches"] = currentMatchesReduced.filter(
      (currentMatch) => {
        const otherMatch = otherScanMatchesReduced.find(
          (val2) =>
            val2.artifact.name === currentMatch.artifact.name &&
            val2.artifact.version === currentMatch.artifact.version &&
            val2.vulnerability.id === currentMatch.vulnerability.id
        );

        const matchExisted = otherMatch !== undefined;

        if (!matchExisted) return false;

        const secondaryAttributesDiffer =
          currentMatch.vulnerability.severity !==
            otherMatch.vulnerability.severity ||
          JSON.stringify(currentMatch.vulnerability.cvss) !==
            JSON.stringify(otherMatch.vulnerability.cvss) ||
          JSON.stringify(currentMatch.vulnerability.fix) !==
            JSON.stringify(otherMatch.vulnerability.fix) ||
          JSON.stringify(currentMatch.matchDetails) !==
            JSON.stringify(otherMatch.matchDetails);

        return secondaryAttributesDiffer;
      }
    );

    setDiff({ additions, removals, changes });
  };

  useEffect(() => {
    const fetchData = async () => {
      const getScanRes = await apiFetch<Scan>(`scans/${params.scanId}`);

      if (!getScanRes.success) return;
      setScan(getScanRes.responseObject);

      const getSbomRes = await apiFetch<Sbom>(
        `sboms/${getScanRes.responseObject.sbomId}`
      );

      if (!getSbomRes.success) return;
      setSbom(getSbomRes.responseObject);

      const getScansRes = await apiFetch<Scans>(
        `scans?sbomId=${getScanRes.responseObject.sbomId}`
      );

      if (!getScansRes.success) return;

      const otherScans =
        getScansRes.responseObject?.filter(
          (val) => val?.resultHash && val.id !== params.scanId
        ) || [];

      const options = [
        <option key="empty" value=""></option>,
        ...(otherScans.map((val) => {
          return (
            <option key={val.id} value={val.id}>
              {formatDate(val.createdAt)}
            </option>
          );
        }) || []),
      ];

      setScanOptions(options);
    };
    fetchData();
  }, [params.scanId]);

  const mapAddOrChangeToClassName = (
    cve: string,
    name: string,
    version: string
  ) => {
    const inAdditions =
      diff.additions.findIndex(
        (val) => val.cve === cve && val.name === name && val.version === version
      ) !== -1;

    if (inAdditions) return styles.green;

    const inChanges =
      diff.changes.findIndex(
        (val) =>
          val.vulnerability.id === cve &&
          val.artifact.name === name &&
          val.artifact.version === version
      ) !== -1;

    if (inChanges) return styles.blue;

    return styles.standard;
  };

  const selectOldAndNewMatches = (
    cve: string,
    pkg: string,
    version: string
  ) => {
    const currentMatch = scan?.result?.matches.find(
      (val) =>
        val.vulnerability.id.toLowerCase().trim() ===
          cve.toLowerCase().trim() &&
        val.artifact.name.toLowerCase().trim() === pkg.toLowerCase().trim() &&
        val.artifact.version.toLowerCase().trim() ===
          version.toLowerCase().trim()
    );

    const selectedMatch = selectedScan?.result?.matches.find(
      (val) =>
        val.vulnerability.id.toLowerCase().trim() ===
          cve.toLowerCase().trim() &&
        val.artifact.name.toLowerCase().trim() === pkg.toLowerCase().trim() &&
        val.artifact.version.toLowerCase().trim() ===
          version.toLowerCase().trim()
    );

    if (currentMatch === undefined || selectedMatch === undefined) {
      setSelectedScanMatch(undefined);
      return;
    }

    const currentReducedMatch = reducedResult([currentMatch])[0];
    const selectedReducedMatch = reducedResult([selectedMatch])[0];

    setSelectedScanMatch({
      selectedMatch: selectedReducedMatch,
      currentMatch: currentReducedMatch,
    });
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "70% 30%" }}>
      <div>
        {sbom && scan ? (
          <React.Fragment>
            <div style={{ width: "100%", height: "25vh" }}>
              <h1>{params.scanId}</h1>
              <p>
                Scan der Sbom {sbom?.prettyName} vom{" "}
                {formatDate(scan?.createdAt)}
              </p>
              <span>Vegleichen mit:</span>
              <select
                onChange={(e) =>
                  calcDiff(e.target.value, scan.result?.matches || [])
                }
              >
                {scanOptions}
              </select>
              <br />
              <p>
                Additions seit dem ausgewählten Datum: {diff.additions.length}
              </p>
              <p>
                Deletions seit dem ausgewählten Datum: {diff.removals.length}
              </p>
              <p>Changes seit dem ausgewählten Datum: {diff.changes.length}</p>
            </div>
            <div style={{ width: "100%", overflowY: "scroll", height: "70vh" }}>
              <table className={mainStyles.table}>
                <thead>
                  <tr>
                    <th>Paket</th>
                    <th>Version</th>
                    <th>CVE</th>
                    <th>Match-Typ</th>
                    <th>Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {diff.removals.map((val) => {
                    return (
                      <tr
                        key={`${val.cve}/${val.name}/${val.version}`}
                        className={styles.red}
                        onClick={() => setSelectedScanMatch(undefined)}
                      >
                        <td>{val.name}</td>
                        <td>{val.version}</td>
                        <td>{val.cve.toUpperCase()}</td>
                        <td>{val.type}</td>
                        <td>{val.severity}</td>
                      </tr>
                    );
                  })}
                  {scan?.result?.matches.map((scan) => {
                    return (
                      <tr
                        key={`${scan.vulnerability.id}/${scan.artifact.name}/${scan.artifact.version}`}
                        className={mapAddOrChangeToClassName(
                          scan.vulnerability.id.trim().toLowerCase(),
                          scan.artifact.name.trim().toLowerCase(),
                          scan.artifact.version.trim().toLowerCase()
                        )}
                        onClick={() =>
                          selectOldAndNewMatches(
                            scan.vulnerability.id,
                            scan.artifact.name,
                            scan.artifact.version
                          )
                        }
                      >
                        <td>{scan.artifact.name}</td>
                        <td>{scan.artifact.version}</td>
                        <td>{scan.vulnerability.id}</td>
                        <td>{scan.matchDetails[0].type}</td>
                        <td>{scan.vulnerability.severity}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </React.Fragment>
        ) : (
          <p>Loading...</p>
        )}
      </div>
      <div style={{ width: "100%" }}>
        <table>
          <thead>
            <tr>
              <th>Attribut</th>
              <th>Vegleich</th>
              <th>Aktuell</th>
            </tr>
          </thead>
          <tbody>
            {selectedScanMatch && (
              <React.Fragment>
                <tr>
                  <td>
                    <b>Vulnerability ID</b>
                  </td>
                  <td>{selectedScanMatch.selectedMatch.vulnerability.id}</td>
                  <td>{selectedScanMatch.currentMatch.vulnerability.id}</td>
                </tr>
                <tr>
                  <td>
                    <b>Severity</b>
                  </td>
                  <td>
                    {selectedScanMatch.selectedMatch.vulnerability.severity}
                  </td>
                  <td>
                    {selectedScanMatch.currentMatch.vulnerability.severity}
                  </td>
                </tr>
                {selectedScanMatch.selectedMatch.vulnerability.cvss.map(
                  ({ metrics }, index) => {
                    const {
                      baseScore: currentBaseScore,
                      exploitabilityScore: currentExpliotabilityScore,
                      impactScore: currentImpactScore,
                    } = selectedScanMatch.currentMatch.vulnerability.cvss[index]
                      .metrics;

                    return (
                      <React.Fragment key={`cvss${index}`}>
                        <tr>
                          <td>
                            <b>CVSS {index + 1}</b>
                          </td>
                          <td></td>
                          <td></td>
                        </tr>
                        <tr>
                          <td>Base Score</td>
                          <td>{metrics.baseScore}</td>
                          <td>{currentBaseScore}</td>
                        </tr>
                        <tr>
                          <td>Exploitability Score</td>
                          <td>{metrics.exploitabilityScore}</td>
                          <td>{currentExpliotabilityScore}</td>
                        </tr>
                        <tr>
                          <td>Impact Score</td>
                          <td>{metrics.impactScore}</td>
                          <td>{currentImpactScore}</td>
                        </tr>
                      </React.Fragment>
                    );
                  }
                )}
                <tr>
                  <td>
                    <b>Fix Versionen</b>
                  </td>
                  <td>
                    {selectedScanMatch.selectedMatch.vulnerability.fix.versions.join(
                      ","
                    )}
                  </td>
                  <td>
                    {selectedScanMatch.currentMatch.vulnerability.fix.versions.join(
                      ","
                    )}
                  </td>
                </tr>
                <tr>
                  <td>
                    <b>Fix Status</b>
                  </td>
                  <td>
                    {selectedScanMatch.selectedMatch.vulnerability.fix.state}
                  </td>
                  <td>
                    {selectedScanMatch.currentMatch.vulnerability.fix.state}
                  </td>
                </tr>
                <tr>
                  <td>
                    <b>Match Details</b>
                  </td>
                  <td>
                    {selectedScanMatch.selectedMatch.matchDetails
                      .map(({ type }) => type)
                      .join(",")}
                  </td>
                  <td>
                    {selectedScanMatch.currentMatch.matchDetails
                      .map(({ type }) => type)
                      .join(",")}
                  </td>
                </tr>
              </React.Fragment>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default View;
