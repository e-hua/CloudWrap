import type { Request, Response, NextFunction } from "express";

/**
Adding SSE callbacks to the respnse object

 */
function sseMiddleware(req: Request, res: Response, next: NextFunction) {
  let alive = true;

  req.on("close", () => {
    alive = false;
    console.log("Client closed the SSE connection");
  });

  // Set up the headers for server-sent events(SSE)
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  // Flush the headers, send them to the client immediately
  // To show that the connection is active
  res.flushHeaders();

  res.sseWrite = (data) => {
    if (!alive) {
      return;
    }

    // The format for SSE message is mandatory
    // "data: " + message + "\n\n"
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  res.sseEnd = (data) => {
    // If the client already ended the connection
    // We don't need to close the response ourselves
    if (!alive) return;

    // Send the customized end event with data
    res.write(`event: end\ndata: ${JSON.stringify(data)}\n\n`);
    res.end();
  };

  res.sseError = (data) => {
    if (!alive) return;

    // Send the customized error event with data
    res.write(`event: error\ndata: ${JSON.stringify(data)}\n\n`);
    res.end();
  };

  next();
}

export { sseMiddleware };
