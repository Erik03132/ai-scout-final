const { createClient } = require("@supabase/supabase-js");

const url = "https://iwtlekdynhfcqgwhocik.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3dGxla2R5bmhmY3Fnd2hvY2lrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTYzODc5NSwiZXhwIjoyMDg3MjE0Nzk1fQ.TyVFqfjc4Ir22cKmZ_sM3l0SMtkSCIcwKJi2G8pxGIY";
const supabase = createClient(url, key);

async function testInsert() {
    const post = {
        title: "Test Video",
        summary: "test",
        content: "test",
        source: "YouTube",
        channel: "Test Channel",
        date: new Date().toISOString(),
        tags: ["Tech"],
        mentions: [],
        views: "0",
        image: "",
        url: "https://www.youtube.com/watch?v=TESTXYZ",
        is_analyzed: false,
    };
    const { data, error } = await supabase.from("posts").insert(post).select();
    console.log("Insert result:", { data, error });
}
testInsert();
