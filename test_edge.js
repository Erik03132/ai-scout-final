const url = "https://iwtlekdynhfcqgwhocik.supabase.co/functions/v1/fetch-youtube";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3dGxla2R5bmhmY3Fnd2hvY2lrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTYzODc5NSwiZXhwIjoyMDg3MjE0Nzk1fQ.TyVFqfjc4Ir22cKmZ_sM3l0SMtkSCIcwKJi2G8pxGIY";
async function run() {
  const req = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` }
  });
  console.log(req.status, await req.text());
}
run();
