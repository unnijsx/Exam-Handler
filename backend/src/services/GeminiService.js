const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

// Helper to convert local file to Gemini generative part
const fileToGenerativePart = (filePath) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found at ${filePath}`);
  }
  const ext = path.extname(filePath).toLowerCase();
  let mimeType = 'image/jpeg';
  if (ext === '.png') mimeType = 'image/png';
  
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(filePath)).toString('base64'),
      mimeType,
    },
  };
};

const evaluateSubmission = async ({
  assignedClasses,
  codeContent,
  screenshotTrainingPath,
  screenshotAccuracyPath,
  screenshotPredictionPath,
}) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set on the server.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { responseMimeType: 'application/json' },
  });

  const prompt = `
You are an expert AI & Machine Learning evaluator grading a student's Practical CNN Image Classification Examination.
The student was assigned the following three animal classes: ${assignedClasses.join(', ')}.

Your task is to analyze the student's submitted code and the three uploaded screenshots to evaluate their performance.

Criteria:
1. Code Quality (max 25 marks): Structure, readability, modularity, and cleanliness.
2. Dataset Handling (max 25 marks): Data loading, preprocessing, split ratio, custom dataset class if any, and checking if they correctly filtered and loaded ONLY the assigned classes (${assignedClasses.join(', ')}).
3. CNN Implementation (max 25 marks): Model architecture details, convolution/pooling layers, activation functions, optimizers, and loss calculation.
4. Output Quality (max 25 marks): Training progression, convergence, final validation metrics, and correct classification outputs on prediction images matching the assigned classes.

Here is the student's submitted code:
\`\`\`python
${codeContent}
\`\`\`

The user has uploaded three screenshots which are attached below in order:
1. Training Completed Screenshot (epoch log / console metrics)
2. Accuracy Graph Screenshot (accuracy & loss curves plot)
3. Prediction Output Screenshot (sample test predictions with labels)

Please review the code and visual outcomes carefully. If the screenshots do not match the assigned classes, or look fraudulent/copied, penalize appropriately in dataset handling and output quality, and note this in the summary.

Provide a detailed summary in your markdown overallSummary detailing what they did well and where they can improve.

You must return a JSON response matching this schema:
{
  "codeQualityScore": number (0-25),
  "datasetHandlingScore": number (0-25),
  "cnnImplementationScore": number (0-25),
  "outputQualityScore": number (0-25),
  "overallSummary": "string (Markdown format containing evaluation notes, details about the screenshots content check, and final feedback)",
  "suggestedScore": number (0-100)
}
`;

  try {
    const parts = [prompt];

    // Add images if they exist
    if (screenshotTrainingPath && fs.existsSync(screenshotTrainingPath)) {
      parts.push(fileToGenerativePart(screenshotTrainingPath));
    }
    if (screenshotAccuracyPath && fs.existsSync(screenshotAccuracyPath)) {
      parts.push(fileToGenerativePart(screenshotAccuracyPath));
    }
    if (screenshotPredictionPath && fs.existsSync(screenshotPredictionPath)) {
      parts.push(fileToGenerativePart(screenshotPredictionPath));
    }

    const result = await model.generateContent(parts);
    const responseText = result.response.text();
    
    // Parse the JSON result
    const evaluation = JSON.parse(responseText);
    return evaluation;
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error(`AI Evaluation failed: ${error.message}`);
  }
};

module.exports = {
  evaluateSubmission,
};
