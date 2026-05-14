import { Router, Request, Response } from "express";
import { store } from "../store";

export function createExportRouter() {
  const router = Router();

  router.get("/csv", (_req: Request, res: Response) => {
    const packets = store.getAllPackets();
    const headers = ["id", "timestamp", "src_ip", "dst_ip", "protocol", "src_port", "dst_port", "length"];
    const rows = packets.map((p) =>
      headers.map((h) => {
        const val = (p as any)[h];
        return typeof val === "string" && val.includes(",") ? `"${val}"` : String(val ?? "");
      }).join(",")
    );

    const csv = [headers.join(","), ...rows].join("\r\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="packets_${Date.now()}.csv"`);
    res.send(csv);
  });

  router.get("/json", (_req: Request, res: Response) => {
    const packets = store.getAllPackets();
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="packets_${Date.now()}.json"`);
    res.json(packets);
  });

  return router;
}
