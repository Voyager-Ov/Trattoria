const fs = require("fs");

async function main() {
    try {
        const res = await fetch("https://spectrums.framer.website/");
        const html = await res.text();
        const svgs = html.match(/<svg[^>]*>[\s\S]*?<\/svg>/g);

        if (svgs) {
            const cleanSvgs = svgs
                .map(s => s.replace(/&quot;/g, '"'))
                .slice(10, 15); // Pick some distinct abstract shapes
            fs.writeFileSync("temp_svgs.txt", cleanSvgs.join("\n\n"));
            console.log("Success");
        } else {
            console.log("No SVGs found.");
        }
    } catch (e) {
        console.error(e);
    }
}
main();
