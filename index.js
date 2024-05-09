const fs = require("fs");
const natural = require("natural");
const { WordTokenizer, stopwords } = natural;
const wordnet = new natural.WordNet();

// Load descriptions and keywords from JSON files
const descriptions = JSON.parse(
  fs.readFileSync("sub-sector-desc.json", "utf-8")
);
const keywordsArr = JSON.parse(fs.readFileSync("keywords.json", "utf-8"));
const keywords = keywordsArr.map((keyword) => keyword.word);

// Tokenizer and stopwords
const tokenizer = new WordTokenizer();
const stopWords = new Set(stopwords.words);

// Function to get synonyms of a word using WordNet
async function getSynonyms(word) {
  return new Promise((resolve, reject) => {
    wordnet.lookup(word, (results) => {
      const synonyms = new Set();
      if (results) {
        results.forEach((result) => {
          result.synonyms.forEach((syn) => synonyms.add(syn.toLowerCase()));
        });
      }
      resolve(synonyms);
    });
  });
}

// Preprocess text by tokenizing and removing stopwords
function preprocessText(text) {
  return tokenizer
    .tokenize(text.toLowerCase())
    .filter((word) => word.match(/^[a-zA-Z0-9]+$/))
    .filter((word) => !stopWords.has(word));
}

// Match keywords in descriptions and calculate scores
async function matchKeywords(descriptions, keywords) {
  const sectorScores = {};

  for (const [sector, description] of Object.entries(descriptions)) {
    sectorScores[sector] = {};
    const descriptionWords = preprocessText(description);
    // console.log({ descriptionWords });
    for (const keyword of keywords) {
      const synonyms = await getSynonyms(keyword);
      synonyms.add(keyword.toLowerCase());

      descriptionWords.forEach((word) => {
        if (synonyms.has(word)) {
          //if ([...synonyms].indexOf(word)) {
          sectorScores[sector][keyword] =
            (sectorScores[sector][keyword] || 0) + 1;
        }
      });
    }
  }

  return sectorScores;
}

// Main function
async function main() {
  const sectorScores = await matchKeywords(descriptions, keywords);
  //   console.log({ sectorScores });

  // Convert scores to lists for JSON output
  const output = {};
  for (const [sector, scores] of Object.entries(sectorScores)) {
    output[sector] = {
      Keywords: Object.keys(scores),
      Scores: Object.values(scores),
    };
  }
  console.log(JSON.stringify(output, null, 4));
}

main();
