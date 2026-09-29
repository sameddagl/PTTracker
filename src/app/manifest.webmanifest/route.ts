import { manifestResponse, webManifest } from "@/lib/manifest";

export const GET = () => manifestResponse(webManifest());
