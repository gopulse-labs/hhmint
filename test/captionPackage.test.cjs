const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

require.extensions[".ts"] = function registerTypeScript(module, filename) {
  const source = fs.readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2019,
      esModuleInterop: true,
    },
    fileName: filename,
  });

  module._compile(output.outputText, filename);
};

const {
  buildCaptionPackage,
  formatCaptionPackageForShare,
} = require(path.join(__dirname, "../src/lib/captionPackage.ts"));

const climateHeadline =
  "Scientists warn Atlantic cold blob could signal weakening ocean circulation";

test("caption is not the old headline plus style structure", () => {
  const captionPackage = buildCaptionPackage({
    headline: climateHeadline,
    style: "Dada",
  });

  assert.equal(captionPackage.caption.startsWith('"'), false);
  assert.doesNotMatch(captionPackage.caption, /reimagined in Dada style/i);
  assert.doesNotMatch(captionPackage.caption, /Created with HeadlineHarmonies/i);
});

test("caption includes human interpretation and HeadlineHarmonies attribution", () => {
  const captionPackage = buildCaptionPackage({
    headline: climateHeadline,
    style: "Dada",
  });

  assert.match(captionPackage.caption, /This headline felt less like/i);
  assert.match(captionPackage.caption, /I pictured/i);
  assert.match(captionPackage.caption, /Based on a recent headline about/i);
  assert.match(captionPackage.caption, /Made with HeadlineHarmonies\./);
});

test("hashtags are capped at seven and use specific topic and style tags", () => {
  const captionPackage = buildCaptionPackage({
    headline: climateHeadline,
    style: "Dada",
  });

  assert.ok(captionPackage.hashtags.length >= 3);
  assert.ok(captionPackage.hashtags.length <= 7);
  assert.ok(captionPackage.hashtags.includes("#ClimateArt"));
  assert.ok(captionPackage.hashtags.includes("#OceanScience"));
  assert.ok(captionPackage.hashtags.includes("#DadaArt"));
});

test("generic hashtags are avoided when topic and style tags are available", () => {
  const captionPackage = buildCaptionPackage({
    headline: "New AI chip rules reshape the technology race",
    style: "Surrealist",
  });
  const genericTags = ["#AIArt", "#DigitalArt", "#Art", "#Artist", "#InstaArt", "#GeneratedArt"];

  assert.ok(captionPackage.hashtags.includes("#TechCulture"));
  assert.ok(captionPackage.hashtags.includes("#SurrealCollage"));
  for (const tag of genericTags) {
    assert.equal(captionPackage.hashtags.includes(tag), false);
  }
});

test("formatted share text includes the caption and hashtags", () => {
  const captionPackage = buildCaptionPackage({
    headline: climateHeadline,
    style: "Dada",
  });
  const shareText = formatCaptionPackageForShare(captionPackage);

  assert.ok(shareText.includes(captionPackage.caption));
  for (const tag of captionPackage.hashtags) {
    assert.ok(shareText.includes(tag));
  }
});
