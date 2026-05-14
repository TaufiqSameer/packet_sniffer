import { Router, Request, Response } from "express";
import { Server as IOServer } from "socket.io";
import { store } from "../store";

export function createPacketRouter(io: IOServer) {
  const router = Router();

  router.post("/ingest", (req: Request, res: Response) => {
    const { packets } = req.body;
    if (!Array.isArray(packets)) {
      res.status(400).json({ error: "packets must be an array" });
      return;
    }

    const { packets: newPackets, alerts: newAlerts } = store.addPackets(packets);

    io.emit("packets", newPackets);
    if (newAlerts.length > 0) {
      io.emit("alerts", newAlerts);
    }
    io.emit("stats", store.getStats());

    res.json({ received: newPackets.length, alerts_fired: newAlerts.length });
  });

  router.get("/packets", (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 100;
    res.json(store.getPackets(limit));
  });

  router.get("/stats", (_req: Request, res: Response) => {
    res.json(store.getStats());
  });

  router.get("/alerts", (_req: Request, res: Response) => {
    res.json(store.getAlerts());
  });

  router.get("/top-ips", (req: Request, res: Response) => {
    const n = parseInt(req.query.n as string) || 10;
    res.json(store.getTopIPs(n));
  });

  router.delete("/clear", (_req: Request, res: Response) => {
    store.clearAll();
    io.emit("cleared");
    res.json({ ok: true });
  });

  return router;
}
