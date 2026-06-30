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
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const model = genAI.getGenerativeModel({
    model: modelName,
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

Please review the code and visual outcomes carefully. Note that the student is only required to show predictions or outputs for at least one of their three assigned classes (e.g., if they are assigned ['Dog', 'Cat', 'Cow'], a screenshot showing predictions for just 'Dog' is fully acceptable; they do not need to show predictions for all three classes). Do not penalize them if they show predictions for at least one of their assigned classes. However, if the screenshots completely fail to match any of their assigned classes, or look fraudulent/copied, then penalize them appropriately in dataset handling and output quality, and note this in the summary.

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

    // Quick sanity check on key format for developer assistance
    if (!apiKey.startsWith('AIzaSy')) {
      console.warn("⚠️ Warning: GEMINI_API_KEY in backend/.env does not start with 'AIzaSy'. Google AI Studio keys typically begin with 'AIzaSy'.");
    }

    const result = await model.generateContent(parts);
    const responseText = result.response.text();
    
    // Parse the JSON result
    const evaluation = JSON.parse(responseText);
    return evaluation;
  } catch (error) {
    console.error('Gemini API Error:', error);
    const errorMsg = error.message || '';
    if (errorMsg.includes('401') || errorMsg.includes('API_KEY_INVALID') || errorMsg.includes('authentication credentials')) {
      throw new Error("AI Evaluation failed: Invalid or unauthorized API key. Please check your GEMINI_API_KEY in backend/.env (must be a valid Google AI Studio key starting with 'AIzaSy').");
    }
    if (errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('Quota exceeded') || errorMsg.includes('Too Many Requests')) {
      throw new Error("AI Evaluation failed: Gemini API quota exceeded (429 Too Many Requests). If you are on the free tier, you may have reached your request limit. Please check your billing/usage details, or try setting GEMINI_MODEL to a different model (e.g. 'gemini-1.5-flash' or 'gemini-1.5-pro') in backend/.env.");
    }
    throw new Error(`AI Evaluation failed: ${errorMsg}`);
  }
};

module.exports = {
  evaluateSubmission,
};
