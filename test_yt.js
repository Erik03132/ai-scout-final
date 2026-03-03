const apiKey = "AIzaSyCIYljCw-WC7umWD8Xyp4J_-qLhqI7BeWo"; // Wait, in .env.local it is:
// YOUTUBE_API_KEY=AIzaSyBZlh-83bo2jgKHIc3V48jK0SR3psCBPwI
const key = "AIzaSyBZlh-83bo2jgKHIc3V48jK0SR3psCBPwI";
async function run() {
  const handle = "googledeepmind";
  const url = `https://www.googleapis.com/youtube/v3/channels?key=${key}&forHandle=${handle}&part=id,contentDetails`;
  const res = await fetch(url);
  console.log(await res.json());
}
run();
