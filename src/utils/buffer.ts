import https from "https";

export const getBufferFromUrl = async (url: string): Promise<Buffer> => {
  return new Promise((resolve) => {
    https.get(url, (response) => {
      const body: Buffer[] = [];
      response
        .on("data", (chunk: Buffer) => {
          body.push(chunk);
        })
        .on("end", () => {
          resolve(Buffer.concat(body));
        });
    });
  });
};
