(function() {

  // Create model
  const CATEGORIES_COUNT = 6;
  const model = tf.sequential({
    layers: [
      tf.layers.dense({inputShape: [CATEGORIES_COUNT], units: 50, activation: 'relu'}),
      tf.layers.dense({units: 50, activation: 'relu'}),
      tf.layers.dense({units: 50, activation: 'relu'}),
      tf.layers.dense({units: 30, activation: 'relu'}),
      tf.layers.dense({units: 3, activation: 'softmax'}),
    ]
  });

  model.compile({
    optimizer: 'sgd',
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy']
  });

  // warm-up
  tf.tidy(() => model.predict(tf.zeros([1, CATEGORIES_COUNT])));

  // Train for 20 epochs with batch size 16
  function onBatchEnd(batch, logs) {
    console.log('Accuracy', logs.acc);
  }

  function train() {
    // Get data
    // TODO: when `train` button is clicked, these should be filled entirely (not just
    // one example)
    // const trainData = window.lastDataset
    const trainX = tf.tensor(window.lastX)     // Must be shape [num_examples, 9]
    const trainY = tf.tensor(window.lastY)     // Must be shape [num_examples, 3] (one-hot)
    alert(43)
    console.log('trainX', trainX)
    console.log(trainY)

    model.fit(trainX, trainY, {
      epochs: 50,
      batchSize: 16,
      callbacks: {onBatchEnd}
    }).then(info => {
      console.log('Final accuracy', info.history.acc);
    });
  }

  // Train for 20 epochs with batch size 16
  function onBatchEnd(batch, logs) {
    console.log('Accuracy', batch, logs.acc);
  }

  function onTrainClick(game) {
    // Get data
    // TODO: when train button is clicked, these should be filled entirely (not just
    // one example)
    const trainData = game.historicalDataset;
    const trainX = tf.tensor(DATASETS.toX(trainData));     // Must be shape [num_examples, 9]
    const trainY = tf.tensor(DATASETS.toY(trainData));     // Must be shape [num_examples, 3] (one-hot)
    console.log('trainX', trainX)

    // Start the animation
    const {onTrainingDone} = TRAINING_ANIMATION.animate(trainData, 1500);

    // Start training after delay, so animation rendering can start
    setTimeout(function() {
      model.fit(trainX, trainY, {
        epochs: 20,
        batchSize: 16,
        callbacks: {onBatchEnd}
      }).then(info => {
        // update game state
        game.training.finalAccuracy = info.history.acc;
        game.training.trainedModel = model;

        // animation UI feedback
        onTrainingDone();
      });
    }, 100);
  }

  function init(game, options = {}) {
    options.trainButtonEl.addEventListener('click', onTrainClick.bind(null, game));
    options.deployButtonEl.addEventListener('click', onDeployToCity.bind(null, game));
  }

  function onDeployToCity(game) {
    // make sure trained already
    if (!game.training.trainedModel) {
      alert('Train the model first!');
      return;
    }

    // predict for all cities and update datasets
    assignCampTo(game.firstCityDataset);
    assignCampTo(game.secondCityDataset);
    assignCampTo(game.thirdCityDataset);

    // animate as if it were doing all at once
    var allDatasets = _.flatten([
      game.firstCityDataset,
      game.secondCityDataset,
      game.thirdCityDataset,
    ]);
    console.log('allDatasets', allDatasets);
    window.DEPLOY_ANIMATION.animate(allDatasets);
  }

  function assignCampTo(dataset) {
    dataset.forEach(function(dataPoint) {
      dataPoint.assignedCamp = predict(dataPoint);
    });
  }

  // In deployment, make a new prediction and return the camp
  // string key
  function predict(dataPoint) {
    const testX = tf.tensor(DATASETS.toX([dataPoint]));
    const prediction = model.predict(testX);
    const campIndex = tf.argMax(prediction.arraySync()[0]).arraySync();
    const camp = DATASETS.constants.camps[campIndex];
    return camp;
  }

  window.TRAINING = {
    init: init,
    predict: predict
  };
})();
