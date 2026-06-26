require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const Question = require('./models/Question');
const Student = require('./models/Student');
const ExamSession = require('./models/ExamSession');
const Result = require('./models/Result');
const CodingSubmission = require('./models/CodingSubmission');

const questionsData = [
  // --- PYTHON ---
  {
    topic: 'PYTHON',
    questionText: 'What is the correct syntax to output the type of a variable x in Python?',
    options: ['print(typeof(x))', 'print(type(x))', 'print(x.type())', 'print(typeof x)'],
    correctAnswer: 'print(type(x))'
  },
  {
    topic: 'PYTHON',
    questionText: 'Which of the following data types is immutable in Python?',
    options: ['List', 'Dictionary', 'Set', 'Tuple'],
    correctAnswer: 'Tuple'
  },
  {
    topic: 'PYTHON',
    questionText: 'What is the result of 3 * 1 ** 3 in Python?',
    options: ['3', '27', '1', '9'],
    correctAnswer: '3'
  },
  {
    topic: 'PYTHON',
    questionText: 'Which keyword is used to define a function in Python?',
    options: ['func', 'define', 'def', 'function'],
    correctAnswer: 'def'
  },
  {
    topic: 'PYTHON',
    questionText: 'How do you check if the key "name" exists in a dictionary d?',
    options: ['"name" in d', 'd.has("name")', 'd.exists("name")', '"name" d.keys()'],
    correctAnswer: '"name" in d'
  },
  {
    topic: 'PYTHON',
    questionText: 'What does the list method pop() do by default if no index is specified?',
    options: ['Removes the first item', 'Removes the last item', 'Clears the list', 'Removes a random item'],
    correctAnswer: 'Removes the last item'
  },
  {
    topic: 'PYTHON',
    questionText: 'Which of the following blocks executes in Python whether an exception is raised or not?',
    options: ['except', 'else', 'finally', 'try'],
    correctAnswer: 'finally'
  },
  {
    topic: 'PYTHON',
    questionText: 'How do you add an element to a Python Set?',
    options: ['set.add(x)', 'set.append(x)', 'set.insert(x)', 'set.push(x)'],
    correctAnswer: 'set.add(x)'
  },
  {
    topic: 'PYTHON',
    questionText: 'What is the index of the first element in a Python list?',
    options: ['-1', '0', '1', 'Index does not exist'],
    correctAnswer: '0'
  },
  {
    topic: 'PYTHON',
    questionText: 'Which operator is used for floor division in Python?',
    options: ['/', '%', '//', '**'],
    correctAnswer: '//'
  },

  // --- NUMPY ---
  {
    topic: 'NUMPY',
    questionText: 'Which NumPy function is used to create an array with a range of values?',
    options: ['np.range()', 'np.arange()', 'np.linspace()', 'np.array_range()'],
    correctAnswer: 'np.arange()'
  },
  {
    topic: 'NUMPY',
    questionText: 'What does the .shape attribute of a NumPy array return?',
    options: ['A list of data types', 'A tuple of array dimensions', 'The total number of elements', 'The memory footprint in bytes'],
    correctAnswer: 'A tuple of array dimensions'
  },
  {
    topic: 'NUMPY',
    questionText: 'How do you perform element-wise multiplication of two NumPy arrays a and b?',
    options: ['a * b', 'np.dot(a, b)', 'a.multiply(b)', 'a @ b'],
    correctAnswer: 'a * b'
  },
  {
    topic: 'NUMPY',
    questionText: 'Which method is used to change the layout or shape of an array without changing its data?',
    options: ['np.resize()', 'np.reshape()', 'np.transpose()', 'np.flatten()'],
    correctAnswer: 'np.reshape()'
  },
  {
    topic: 'NUMPY',
    questionText: 'How do you select the element at row index 1 and column index 2 of a 2D NumPy array "arr"?',
    options: ['arr[1, 2]', 'arr[1][2]', 'Both arr[1, 2] and arr[1][2]', 'arr(1, 2)'],
    correctAnswer: 'Both arr[1, 2] and arr[1][2]'
  },

  // --- PANDAS ---
  {
    topic: 'PANDAS',
    questionText: 'What is the default index type of a Pandas Series if no index is provided?',
    options: ['Integers starting from 1', 'Integers starting from 0', 'Letters starting from a', 'None'],
    correctAnswer: 'Integers starting from 0'
  },
  {
    topic: 'PANDAS',
    questionText: 'Which function in Pandas is used to load data from a CSV file into a DataFrame?',
    options: ['pd.load_csv()', 'pd.open_csv()', 'pd.read_csv()', 'pd.fetch_csv()'],
    correctAnswer: 'pd.read_csv()'
  },
  {
    topic: 'PANDAS',
    questionText: 'What does the DataFrame method df.head(10) return?',
    options: ['The first 10 columns', 'The last 10 rows', 'The first 10 rows', 'The column headers only'],
    correctAnswer: 'The first 10 rows'
  },
  {
    topic: 'PANDAS',
    questionText: 'Which DataFrame method provides a quick statistical summary of numerical columns (mean, count, std, etc.)?',
    options: ['df.info()', 'df.describe()', 'df.summary()', 'df.statistics()'],
    correctAnswer: 'df.describe()'
  },
  {
    topic: 'PANDAS',
    questionText: 'How do you drop columns in a Pandas DataFrame?',
    options: ['df.drop(columns=[col])', 'df.remove(col)', 'df.delete(col)', 'df.discard(col)'],
    correctAnswer: 'df.drop(columns=[col])'
  },
  {
    topic: 'PANDAS',
    questionText: 'Which method is used to fill NaN values in a Pandas DataFrame?',
    options: ['df.fillna()', 'df.replace_nan()', 'df.dropna()', 'df.interpolate()'],
    correctAnswer: 'df.fillna()'
  },

  // --- MATPLOTLIB ---
  {
    topic: 'MATPLOTLIB',
    questionText: 'What function in Matplotlib is used to draw a line plot?',
    options: ['plt.line()', 'plt.plot()', 'plt.draw()', 'plt.show()'],
    correctAnswer: 'plt.plot()'
  },
  {
    topic: 'MATPLOTLIB',
    questionText: 'Which function is used to create a scatter plot in Matplotlib?',
    options: ['plt.points()', 'plt.scatter()', 'plt.draw_scatter()', 'plt.graph()'],
    correctAnswer: 'plt.scatter()'
  },
  {
    topic: 'MATPLOTLIB',
    questionText: 'How do you add a title to a Matplotlib chart?',
    options: ['plt.add_title()', 'plt.header()', 'plt.title()', 'plt.label()'],
    correctAnswer: 'plt.title()'
  },
  {
    topic: 'MATPLOTLIB',
    questionText: 'Which Matplotlib function is used to label the x-axis?',
    options: ['plt.xlabel()', 'plt.x_label()', 'plt.label_x()', 'plt.xaxis()'],
    correctAnswer: 'plt.xlabel()'
  },

  // --- EDA ---
  {
    topic: 'EDA',
    questionText: 'In EDA, what is the primary purpose of identifying missing/null values in a dataset?',
    options: ['To speed up computation', 'To decide on imputation or dropping rows before model training', 'To increase dimensions', 'To delete all data'],
    correctAnswer: 'To decide on imputation or dropping rows before model training'
  },
  {
    topic: 'EDA',
    questionText: 'Which method is used to count duplicate rows in a Pandas DataFrame?',
    options: ['df.duplicated().sum()', 'df.count_duplicates()', 'df.unique()', 'df.drop_duplicates()'],
    correctAnswer: 'df.duplicated().sum()'
  },
  {
    topic: 'EDA',
    questionText: 'What was the target variable in the classic Titanic Dataset binary classification challenge?',
    options: ['Age', 'Survived', 'Pclass', 'Fare'],
    correctAnswer: 'Survived'
  },
  {
    topic: 'EDA',
    questionText: 'In Gender Classification datasets, converting "Male"/"Female" strings to 0/1 integers is called:',
    options: ['Feature Selection', 'Dimensionality Reduction', 'Categorical Encoding', 'Normalization'],
    correctAnswer: 'Categorical Encoding'
  },
  {
    topic: 'EDA',
    questionText: 'Why is feature selection critical in Machine Learning?',
    options: ['It decreases execution speed', 'It reduces overfitting and improves model accuracy by removing irrelevant features', 'It generates new labels', 'It increases dataset dimensions'],
    correctAnswer: 'It reduces overfitting and improves model accuracy by removing irrelevant features'
  },

  // --- AI/ML BASICS ---
  {
    topic: 'AI/ML BASICS',
    questionText: 'What is the main characteristic of Supervised Learning?',
    options: ['The training data is unlabelled', 'The training data is accompanied by ground-truth labels', 'The model learns solely from feedback loops', 'No training data is used'],
    correctAnswer: 'The training data is accompanied by ground-truth labels'
  },
  {
    topic: 'AI/ML BASICS',
    questionText: 'Which of the following is an example of Unsupervised Learning?',
    options: ['Linear Regression', 'Logistic Regression', 'K-Means Clustering', 'Decision Trees'],
    correctAnswer: 'K-Means Clustering'
  },
  {
    topic: 'AI/ML BASICS',
    questionText: 'Why do we split datasets into Training and Testing subsets?',
    options: ['To store records on different machines', 'To evaluate the model\'s performance on unseen data and prevent overfitting', 'To double the data size', 'To run tasks in parallel'],
    correctAnswer: 'To evaluate the model\'s performance on unseen data and prevent overfitting'
  },
  {
    topic: 'AI/ML BASICS',
    questionText: 'In a model predicting house prices from square footage and bedrooms, bedrooms represents a:',
    options: ['Label', 'Weight', 'Feature', 'Bias'],
    correctAnswer: 'Feature'
  },

  // --- LINEAR REGRESSION ---
  {
    topic: 'LINEAR REGRESSION',
    questionText: 'What is the standard optimization objective in Simple Linear Regression?',
    options: ['Maximize R-squared', 'Minimize Mean Squared Error (MSE)', 'Minimize absolute weights sum', 'Maximize cross-entropy'],
    correctAnswer: 'Minimize Mean Squared Error (MSE)'
  },
  {
    topic: 'LINEAR REGRESSION',
    questionText: 'In y = mx + c, what does the coefficient "m" represent?',
    options: ['Intercept', 'Slope', 'Dependent Variable', 'Error term'],
    correctAnswer: 'Slope'
  },

  // --- LOGISTIC REGRESSION ---
  {
    topic: 'LOGISTIC REGRESSION',
    questionText: 'What range of values does the Sigmoid function output in Logistic Regression?',
    options: ['[-1, 1]', '[0, infinity]', '[0, 1]', '[-infinity, 1]'],
    correctAnswer: '[0, 1]'
  },
  {
    topic: 'LOGISTIC REGRESSION',
    questionText: 'Despite its name, Logistic Regression is primarily used for:',
    options: ['Continuous values regression', 'Clustering', 'Classification', 'Dimensionality reduction'],
    correctAnswer: 'Classification'
  },

  // --- DECISION TREE ---
  {
    topic: 'DECISION TREE',
    questionText: 'In a Decision Tree, the very top node that splits the entire dataset is called:',
    options: ['Root Node', 'Internal Node', 'Leaf Node', 'Child Node'],
    correctAnswer: 'Root Node'
  },
  {
    topic: 'DECISION TREE',
    questionText: 'What does a Leaf Node represent in a Decision Tree?',
    options: ['A splitting condition', 'A feature index', 'A final decision or class label', 'The start of the tree'],
    correctAnswer: 'A final decision or class label'
  },

  // --- DEEP LEARNING ---
  {
    topic: 'DEEP LEARNING',
    questionText: 'Which layer of a Neural Network is responsible for receiving the raw input features?',
    options: ['Hidden Layer', 'Input Layer', 'Output Layer', 'Convolutional Layer'],
    correctAnswer: 'Input Layer'
  },
  {
    topic: 'DEEP LEARNING',
    questionText: 'What is the role of an activation function in a deep neural network?',
    options: ['To initialize weights', 'To introduce non-linearity so the network can learn complex patterns', 'To regularize learning rates', 'To reshape tensors'],
    correctAnswer: 'To introduce non-linearity so the network can learn complex patterns'
  },

  // --- CNN ---
  {
    topic: 'CNN',
    questionText: 'Which layer in a CNN is responsible for feature extraction using sliding kernels?',
    options: ['Pooling Layer', 'Fully Connected Layer', 'Convolutional Layer', 'Flatten Layer'],
    correctAnswer: 'Convolutional Layer'
  },
  {
    topic: 'CNN',
    questionText: 'What is the main benefit of a Max Pooling layer in a CNN?',
    options: ['It adds non-linearity', 'It downsamples spatial size, reducing parameters and computation', 'It increases channels count', 'It flattens tensors to 1D'],
    correctAnswer: 'It downsamples spatial size, reducing parameters and computation'
  },
  {
    topic: 'CNN',
    questionText: 'Which activation function is most commonly used in the hidden layers of CNNs?',
    options: ['Sigmoid', 'Tanh', 'ReLU', 'Softmax'],
    correctAnswer: 'ReLU'
  },
  {
    topic: 'CNN',
    questionText: 'What is the purpose of the Softmax layer at the end of a multi-class CNN classification model?',
    options: ['To normalize weights', 'To output probability distributions matching the classes count', 'To compute max pooling', 'To perform convolution'],
    correctAnswer: 'To output probability distributions matching the classes count'
  },

  // --- YOLO ---
  {
    topic: 'YOLO',
    questionText: 'What does the acronym YOLO stand for in deep learning object detection?',
    options: ['You Only Live Once', 'You Only Look Once', 'Yield Output Logic Optimization', 'Yet Other Linear Optimizer'],
    correctAnswer: 'You Only Look Once'
  },
  {
    topic: 'YOLO',
    questionText: 'YOLO solves object detection as a single regression problem, producing bounding boxes and class probabilities simultaneously.',
    options: ['True', 'False', 'Cannot determine', 'Applicable only to classification'],
    correctAnswer: 'True'
  },

  // --- NLP ---
  {
    topic: 'NLP',
    questionText: 'What is tokenization in Natural Language Processing (NLP)?',
    options: ['Encrypting sensitive words', 'Breaking text down into smaller units like words or subwords', 'Tagging parts of speech', 'Removing HTML code tags'],
    correctAnswer: 'Breaking text down into smaller units like words or subwords'
  },
  {
    topic: 'NLP',
    questionText: 'Which of the following is a classic pre-processing step in NLP to reduce words to their base form?',
    options: ['Tokenization', 'Lemmatization', 'Word Vectorization', 'Regularization'],
    correctAnswer: 'Lemmatization'
  }
];

const seedDB = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/evalai-campus');
    console.log('Seed: Connected to Database.');

    // 1. Seed Admin
    console.log('Seed: Preparing Admin credentials...');
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@eval';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admineval123';

    await Admin.deleteMany({});
    const admin = new Admin({
      email: adminEmail,
      password: adminPassword,
    });
    await admin.save();
    console.log(`Seed: Admin successfully seeded with email: "${adminEmail}"`);

    // 2. Seed MCQ Questions
    console.log('Seed: Preparing MCQ Question Bank...');
    await Question.deleteMany({});
    await Question.insertMany(questionsData);
    console.log(`Seed: Seeded ${questionsData.length} MCQ questions successfully.`);

    // Clear old student sessions and records to avoid inconsistencies
    console.log('Seed: Cleaning stale test student records...');
    await Student.deleteMany({});
    await ExamSession.deleteMany({});
    await Result.deleteMany({});
    await CodingSubmission.deleteMany({});
    console.log('Seed: Database cleaned. Ready to use!');

    mongoose.connection.close();
    console.log('Seed: Connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Seed: Error seeding database:', error);
    if (require.main === module) {
      process.exit(1);
    }
    throw error;
  }
};

module.exports = { questionsData, seedDB };

if (require.main === module) {
  seedDB();
}
