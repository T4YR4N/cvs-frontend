"use client";

import apiFetch from "@/common/api/apiFetch";
import { useEffect, useState } from "react";
import mainStyles from "@/app/main.module.css";
import { useRouter } from "next/navigation";
import type { Sbom, Scans } from "@/common/api/types";
import { formatDate } from "@/common/date";

const View = ({ params }: { params: { sbomId: string } }) => {
  const [scans, setScans] = useState<Scans>([]);
  const [sbom, setSbom] = useState<Sbom | undefined>(undefined);

  useEffect(() => {
    const fetchData = async () => {
      const getScansRes = await apiFetch<Scans>(
        `scans?sbomId=${params.sbomId}`
      );

      if (!getScansRes.success) return;
      setScans(getScansRes.responseObject);

      const getSbomRes = await apiFetch<Sbom>(`sboms/${params.sbomId}`);

      if (!getSbomRes.success) return;
      setSbom(getSbomRes.responseObject);
    };
    fetchData();
  }, [params.sbomId]);

  const router = useRouter();

  return (
    <div>
      <h1>{sbom?.prettyName}</h1>
      <p>
        Scans der Sbom {sbom?.prettyName} mit der UUID {params.sbomId}
      </p>
      <table className={mainStyles.clickableTable}>
        <thead>
          <tr>
            <th>ID</th>
            <th>SbomID</th>
            <th>Result Hash</th>
            <th>Status</th>
            <th>Erstellt</th>
          </tr>
        </thead>
        <tbody>
          {scans.map((scan) => {
            return (
              <tr key={scan.id} onClick={() => router.push(`/scan/${scan.id}`)}>
                <td>{scan.id}</td>
                <td>{scan.sbomId}</td>
                <td>{scan.resultHash}</td>
                <td>{scan.status}</td>
                <td>{formatDate(scan.createdAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default View;
