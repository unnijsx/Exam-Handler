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
  {
    topic: 'PYTHON',
    questionText: 'Which character is used to start a single-line comment in Python?',
    options: ['//', '#', '/*', '--'],
    correctAnswer: '#'
  },
  {
    topic: 'PYTHON',
    questionText: 'How do you create a variable with the numeric value 5 in Python?',
    options: ['int x = 5', 'x = 5', 'var x = 5', 'x := 5'],
    correctAnswer: 'x = 5'
  },
  {
    topic: 'PYTHON',
    questionText: 'Which of the following is NOT a valid variable name in Python?',
    options: ['my_var', 'var_2', '2var', '_var'],
    correctAnswer: '2var'
  },
  {
    topic: 'PYTHON',
    questionText: 'What is the output of print("Hello" + " " + "World") in Python?',
    options: ['Hello + World', 'Hello World', 'HelloWorld', 'Error'],
    correctAnswer: 'Hello World'
  },
  {
    topic: 'PYTHON',
    questionText: 'Which loop is commonly used to repeat a block of code a specific number of times or iterate over a list in Python?',
    options: ['loop', 'for', 'repeat', 'foreach'],
    correctAnswer: 'for'
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
  {
    topic: 'NUMPY',
    questionText: 'What does the name "NumPy" stand for?',
    options: ['Number Python', 'Numerical Python', 'Null Python', 'New Python'],
    correctAnswer: 'Numerical Python'
  },
  {
    topic: 'NUMPY',
    questionText: 'How do you import the NumPy library using the standard alias "np"?',
    options: ['import numpy as np', 'import np from numpy', 'include numpy as np', 'import numpy'],
    correctAnswer: 'import numpy as np'
  },
  {
    topic: 'NUMPY',
    questionText: 'What is the main multi-dimensional array object in NumPy?',
    options: ['list', 'DataFrame', 'ndarray', 'Series'],
    correctAnswer: 'ndarray'
  },
  {
    topic: 'NUMPY',
    questionText: 'Which NumPy function is used to create an array filled with all zeros?',
    options: ['np.zeros()', 'np.empty()', 'np.nulls()', 'np.fill(0)'],
    correctAnswer: 'np.zeros()'
  },
  {
    topic: 'NUMPY',
    questionText: "How do you find the minimum value in a NumPy array 'arr'?",
    options: ['arr.min()', 'arr.minimum()', 'np.minimum_value(arr)', 'min(arr)'],
    correctAnswer: 'arr.min()'
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
  {
    topic: 'PANDAS',
    questionText: 'How do you import the Pandas library using the standard alias "pd"?',
    options: ['import pandas as pd', 'import pd from pandas', 'import pandas', 'require pandas as pd'],
    correctAnswer: 'import pandas as pd'
  },
  {
    topic: 'PANDAS',
    questionText: 'What are the two primary data structures in Pandas?',
    options: ['Array and List', 'Series and DataFrame', 'Dictionary and Tuple', 'Matrix and Vector'],
    correctAnswer: 'Series and DataFrame'
  },
  {
    topic: 'PANDAS',
    questionText: "Which attribute of a Pandas DataFrame 'df' is used to get its number of rows and columns?",
    options: ['df.size', 'df.shape', 'df.length', 'df.dimensions'],
    correctAnswer: 'df.shape'
  },
  {
    topic: 'PANDAS',
    questionText: "How do you select a single column named 'Age' from a DataFrame 'df'?",
    options: ['df.select("Age")', "df['Age']", 'df.column("Age")', 'df.get("Age")'],
    correctAnswer: "df['Age']"
  },
  {
    topic: 'PANDAS',
    questionText: 'Which Pandas method is commonly used to detect missing or null values in a DataFrame?',
    options: ['df.isnull()', 'df.is_empty()', 'df.check_null()', 'df.missing()'],
    correctAnswer: 'df.isnull()'
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
  {
    topic: 'MATPLOTLIB',
    questionText: "Which module of Matplotlib is most commonly imported as 'plt'?",
    options: ['matplotlib.pyplot', 'matplotlib.plot', 'matplotlib.charts', 'matplotlib.show'],
    correctAnswer: 'matplotlib.pyplot'
  },
  {
    topic: 'MATPLOTLIB',
    questionText: 'Which function is used to display the final plot on the screen in Matplotlib?',
    options: ['plt.display()', 'plt.show()', 'plt.print()', 'plt.render()'],
    correctAnswer: 'plt.show()'
  },
  {
    topic: 'MATPLOTLIB',
    questionText: 'Which function is used to set a label for the vertical axis (y-axis) in Matplotlib?',
    options: ['plt.ylabel()', 'plt.y_label()', 'plt.label_y()', 'plt.yaxis()'],
    correctAnswer: 'plt.ylabel()'
  },
  {
    topic: 'MATPLOTLIB',
    questionText: 'Which Matplotlib function is used to create a bar chart?',
    options: ['plt.bar()', 'plt.barchart()', 'plt.draw_bar()', 'plt.column()'],
    correctAnswer: 'plt.bar()'
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
  {
    topic: 'EDA',
    questionText: 'What does EDA stand for in data science?',
    options: ['Easy Data Analysis', 'Exploratory Data Analysis', 'Efficient Data Assessment', 'External Data Alignment'],
    correctAnswer: 'Exploratory Data Analysis'
  },
  {
    topic: 'EDA',
    questionText: 'Which plot is best suited to visualize the distribution of a single numerical variable?',
    options: ['Scatter Plot', 'Line Plot', 'Histogram', 'Pie Chart'],
    correctAnswer: 'Histogram'
  },
  {
    topic: 'EDA',
    questionText: 'What does a correlation value of 1 indicate between two variables?',
    options: ['No linear relationship', 'Perfect positive linear relationship', 'Perfect negative linear relationship', 'Weak relationship'],
    correctAnswer: 'Perfect positive linear relationship'
  },
  {
    topic: 'EDA',
    questionText: 'Which of the following is commonly used to visualize statistical summaries like the median, quartiles, and outliers?',
    options: ['Line Chart', 'Pie Chart', 'Box Plot', 'Scatter Plot'],
    correctAnswer: 'Box Plot'
  },
  {
    topic: 'EDA',
    questionText: 'Which value represents the most frequently occurring value in a dataset?',
    options: ['Mean', 'Median', 'Mode', 'Variance'],
    correctAnswer: 'Mode'
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
  {
    topic: 'AI/ML BASICS',
    questionText: 'What type of machine learning task is predicting whether an email is "Spam" or "Not Spam"?',
    options: ['Clustering', 'Classification', 'Regression', 'Dimensionality Reduction'],
    correctAnswer: 'Classification'
  },
  {
    topic: 'AI/ML BASICS',
    questionText: "What type of machine learning task is predicting a continuous numeric value, such as a student's final exam score?",
    options: ['Classification', 'Clustering', 'Regression', 'Association'],
    correctAnswer: 'Regression'
  },
  {
    topic: 'AI/ML BASICS',
    questionText: 'In machine learning, what do we call the final output value we are trying to predict?',
    options: ['Feature', 'Weight', 'Label (or Target)', 'Bias'],
    correctAnswer: 'Label (or Target)'
  },
  {
    topic: 'AI/ML BASICS',
    questionText: 'Which of the following is NOT a main paradigm of Machine Learning?',
    options: ['Supervised Learning', 'Unsupervised Learning', 'Reinforcement Learning', 'Compiler Optimization'],
    correctAnswer: 'Compiler Optimization'
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
  {
    topic: 'LINEAR REGRESSION',
    questionText: "In the simple linear regression equation y = mx + c, what does 'x' represent?",
    options: ['Dependent variable', 'Independent variable (Feature)', 'Error term', 'Slope'],
    correctAnswer: 'Independent variable (Feature)'
  },
  {
    topic: 'LINEAR REGRESSION',
    questionText: 'Which of the following is a common evaluation metric for regression models?',
    options: ['Accuracy', 'F1-Score', 'Mean Absolute Error (MAE)', 'Precision'],
    correctAnswer: 'Mean Absolute Error (MAE)'
  },
  {
    topic: 'LINEAR REGRESSION',
    questionText: 'What shape does a simple linear regression model produce when plotted on a 2D grid?',
    options: ['A parabola', 'A circle', 'A straight line', 'An exponential curve'],
    correctAnswer: 'A straight line'
  },
  {
    topic: 'LINEAR REGRESSION',
    questionText: 'If a regression model performs extremely well on the training data but fails to generalize to the test data, it is said to be:',
    options: ['Underfitting', 'Overfitting', 'Optimized', 'Unsupervised'],
    correctAnswer: 'Overfitting'
  },
  {
    topic: 'LINEAR REGRESSION',
    questionText: 'In Linear Regression, what does a correlation coefficient of 0 between two variables suggest?',
    options: ['Perfect positive relationship', 'Perfect negative relationship', 'No linear relationship', 'Strong relationship'],
    correctAnswer: 'No linear relationship'
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
  {
    topic: 'LOGISTIC REGRESSION',
    questionText: 'Which function is used in Logistic Regression to map any real-valued number to a probability value between 0 and 1?',
    options: ['ReLU function', 'Sigmoid function', 'Step function', 'Linear function'],
    correctAnswer: 'Sigmoid function'
  },
  {
    topic: 'LOGISTIC REGRESSION',
    questionText: 'For a binary classification task, how many possible class labels are there?',
    options: ['1', '2', '10', 'Infinite'],
    correctAnswer: '2'
  },
  {
    topic: 'LOGISTIC REGRESSION',
    questionText: 'In logistic regression, if the output probability is 0.70 and the decision threshold is 0.50, what class label is predicted?',
    options: ['0 (Negative Class)', '1 (Positive Class)', '0.50', 'Cannot predict'],
    correctAnswer: '1 (Positive Class)'
  },
  {
    topic: 'LOGISTIC REGRESSION',
    questionText: "Which of the following metrics is most commonly used to evaluate a classification model's correct prediction rate?",
    options: ['Mean Squared Error', 'R-squared', 'Accuracy', 'Root Mean Squared Error'],
    correctAnswer: 'Accuracy'
  },
  {
    topic: 'LOGISTIC REGRESSION',
    questionText: 'Which of the following is the most standard cost function optimized in Logistic Regression?',
    options: ['Mean Squared Error (MSE)', 'Binary Cross-Entropy (or Log Loss)', 'Mean Absolute Error (MAE)', 'R-squared'],
    correctAnswer: 'Binary Cross-Entropy (or Log Loss)'
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
  {
    topic: 'DECISION TREE',
    questionText: 'Decision Trees can be used for both classification and regression tasks.',
    options: ['True', 'False', 'Only classification', 'Only regression'],
    correctAnswer: 'True'
  },
  {
    topic: 'DECISION TREE',
    questionText: 'What is the term for reducing the size of a decision tree by removing sections that provide little power to classify instances?',
    options: ['Sprouting', 'Pruning', 'Trimming', 'Watering'],
    correctAnswer: 'Pruning'
  },
  {
    topic: 'DECISION TREE',
    questionText: 'What is a major advantage of Decision Tree models compared to neural networks?',
    options: ['They always require massive datasets', 'They are easy to interpret and visualize', 'They contain infinite parameters', 'They are completely black-box models'],
    correctAnswer: 'They are easy to interpret and visualize'
  },
  {
    topic: 'DECISION TREE',
    questionText: 'What is a node in a decision tree called if it splits into further sub-nodes?',
    options: ['Leaf Node', 'Internal Node (or Split Node)', 'Terminal Node', 'Root Node only'],
    correctAnswer: 'Internal Node (or Split Node)'
  },
  {
    topic: 'DECISION TREE',
    questionText: 'What name is given to the final nodes at the bottom of a Decision Tree that do not split any further?',
    options: ['Root Nodes', 'Internal Nodes', 'Branch Nodes', 'Leaf Nodes (or Terminal Nodes)'],
    correctAnswer: 'Leaf Nodes (or Terminal Nodes)'
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
  {
    topic: 'DEEP LEARNING',
    questionText: 'What is the basic computational unit of an artificial neural network, inspired by the biological brain?',
    options: ['Neuron (or Perceptron)', 'Transistor', 'Resistor', 'Kernel'],
    correctAnswer: 'Neuron (or Perceptron)'
  },
  {
    topic: 'DEEP LEARNING',
    questionText: 'A neural network with multiple hidden layers is generally called a:',
    options: ['Shallow Neural Network', 'Deep Neural Network', 'Linear Network', 'Single-layer Perceptron'],
    correctAnswer: 'Deep Neural Network'
  },
  {
    topic: 'DEEP LEARNING',
    questionText: 'Which of the following is a widely used optimizer for updating weights during training in Deep Learning?',
    options: ['Adam', 'JSON', 'Matplotlib', 'Pandas'],
    correctAnswer: 'Adam'
  },
  {
    topic: 'DEEP LEARNING',
    questionText: 'Which layer in a neural network lies between the input layer and the output layer?',
    options: ['Hidden Layer', 'Visible Layer', 'First Layer', 'Last Layer'],
    correctAnswer: 'Hidden Layer'
  },
  {
    topic: 'DEEP LEARNING',
    questionText: 'What is the process of passing input data forward through the layers of a neural network to get a prediction called?',
    options: ['Backpropagation', 'Forward Propagation', 'Weight Initialization', 'Gradient Descent'],
    correctAnswer: 'Forward Propagation'
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
  {
    topic: 'CNN',
    questionText: 'What does CNN stand for in Deep Learning?',
    options: ['Convolutional Neural Network', 'Computer Network Node', 'Computational Neural Node', 'Cyclic Network Node'],
    correctAnswer: 'Convolutional Neural Network'
  },
  {
    topic: 'CNN',
    questionText: 'For which type of data are Convolutional Neural Networks (CNNs) most commonly used?',
    options: ['Tabular spreadsheet data', 'Text documents', 'Images and visual data', 'Audio files only'],
    correctAnswer: 'Images and visual data'
  },
  {
    topic: 'CNN',
    questionText: 'In a convolutional layer, what is the sliding window/matrix that performs multiplication over the input image called?',
    options: ['Kernel (or Filter)', 'Biases', 'Activation', 'Pooling window'],
    correctAnswer: 'Kernel (or Filter)'
  },
  {
    topic: 'CNN',
    questionText: 'What is the output shape transition after applying a standard pooling layer in a CNN?',
    options: ['Increases height and width', 'Decreases height and width (spatial size)', 'Increases channels count', 'Does not change anything'],
    correctAnswer: 'Decreases height and width (spatial size)'
  },
  {
    topic: 'CNN',
    questionText: 'Which of the following layers is typically used to flatten the multi-dimensional output of a convolutional layer into a 1D vector before passing it to a fully connected layer?',
    options: ['Convolutional Layer', 'Pooling Layer', 'Flatten Layer', 'Dropout Layer'],
    correctAnswer: 'Flatten Layer'
  },
  {
    topic: 'CNN',
    questionText: 'In a CNN, what does the term "Stride" refer to?',
    options: ['The size of the kernel matrix', 'The step size by which the filter/kernel slides across the input image', 'The activation value of the neuron', 'The number of channels in the input'],
    correctAnswer: 'The step size by which the filter/kernel slides across the input image'
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
