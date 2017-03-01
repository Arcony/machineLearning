

var canvas;
var ctx;
var height = 400;
var width = 400;

var dataBoundaries = [ {min: 0, max:10}, {min:0, max:10} ];

var data = [
    [1, 2],
    [2, 1],
    [2, 4],
    [1, 3],
    [2, 2],

    [3, 1],
    [1, 1],
    [7, 3],
    [8, 2],
    [6, 4],

    [7, 4],
    [8, 1],
    [9, 2],
    [10, 8],
    [9, 10],

    [7, 8],
    [7, 9],
    [8, 11],
    [9, 9],
];

var kmeans = 6;
var npoints = 30;
var means = [];
var assignments = [];
var dataExtremes; // [dimension] .min, .max value for that dimension
var dataRange; // [dimension] = (max - min) value for that dimension
var stepsPerIteration = 20;
var drawDelay = 1000/stepsPerIteration;
var timer = null;
var iterations = 0;

function setup() {

    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    document.getElementById("btnNew").onclick=function(){ start(true); };
    document.getElementById("btnRerun").onclick=function(){ start(false); };

    start(true);
}

function start( bNewData )
{
    ctx.fillStyle = "rgb(255, 255, 255)";
    ctx.fillRect(0,0,width, height);

    if ( bNewData )
    {
        generateRandomData(npoints);
        dataExtremes = getDataExtremes(data);
        dataRange = getDataRanges(dataExtremes);
    }

    iterations = 0;
    means = initMeans(kmeans);
    // makeAssignments();
    draw();

    if ( timer != null ) clearTimeout(timer);
    timer = setTimeout(run, drawDelay*10);
}


function generateRandomData(numPoints)
{
    var point;
    data = [];
    for( var i = 0; i < numPoints; ++i )
    {
        point = randomPoint( dataBoundaries );
        data.push(point);
        // console.log( "random point[" + i + "] = " + point[0] + "," + point[1] );
    }
}

// From the extremes of each dimension, get range (max-min) of dimension
function getDataRanges(extremes) {
    var ranges = [];

    for (var dimension in extremes)
    {
        ranges[dimension] = extremes[dimension].max - extremes[dimension].min;
    }

    return ranges;

}

// For set of points, get min/max values for each dimension

function getDataExtremes(points) {

    var extremes = [];

    for (var i in data)
    {
        var point = data[i];

        for (var dimension in point)
        {
            if ( ! extremes[dimension] )
            {
                extremes[dimension] = {min: 1000, max: 0};
            }

            if (point[dimension] < extremes[dimension].min)
            {
                extremes[dimension].min = point[dimension];
            }

            if (point[dimension] > extremes[dimension].max)
            {
                extremes[dimension].max = point[dimension];
            }
        }
    }

    return extremes;

}

// pick random means within range of points
function initMeans(k) {

    if ( ! k )
    {
        k = kmeans;
    }

    means = [];
    assignments = [];

    while (k--)
    {
        var mean = [];

        for (var dimension in dataExtremes)
        {
            mean[dimension] = dataExtremes[dimension].min + ( Math.random() * dataRange[dimension] );
        }

        means.push(mean);
    }

    return means;

};

function randomPoint( extremes )
{
    var point = [];
    for ( var dimension in extremes )
    {
        // console.log( "point.length = " + point.length );
        // console.log( "extremes[" + dimension + "] = " + extremes[dimension].toString() );
        point.push(
            Math.round(
                extremes[dimension].min
                + ( Math.random() * (extremes[dimension].max - extremes[dimension].min) )
            ) );
        // console.log( "point[" + dimension + "] = " + point[dimension] );
    }

    return point;
}

// Assign each point to the current closest mean point
function makeAssignments() {

    for (var i in data)
    {
        var point = data[i];
        var distances = [];

        for (var j in means)
        {
            var mean = means[j];
            var sum = 0;

            for (var dimension in point)
            {
                var difference = point[dimension] - mean[dimension];
                difference *= difference;
                sum += difference;
            }

            distances[j] = Math.sqrt(sum);
        }

        assignments[i] = distances.indexOf( Math.min.apply(null, distances) );
    }

}


function run() {

    var bMeansMoved = true;
    var bNewAssignments = ( assignments.length == 0 );
    var delay = (bNewAssignments) ? drawDelay * 10 : drawDelay;

    ++iterations;
    console.log("starting iteration " + iterations );

    makeAssignments();  // reassign points to current, nearest cluster centers

    if ( !bNewAssignments )
    {
        bMeansMoved = moveMeans();
    }

    draw();

    if ( timer != null ) { clearTimeout(timer); timer = null; }

    // if cluster centers moved, reassign points to new positions
    if (bMeansMoved)
    {
        timer = setTimeout(run, delay);
    }
    else
    {
        console.log("done in " + iterations + " iterations");
    }
    // otherwse, if centers didn't move, we're done

}

function draw() {

    ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
    ctx.fillRect(0,0,width, height);

    // Draw lines between points and their cluster center (
    ctx.globalAlpha = 0.3;
    for (var point_index in assignments)
    {
        var mean_index = assignments[point_index];
        var point = data[point_index];
        var mean = means[mean_index];

        ctx.save();

        ctx.strokeStyle = 'blue';
        ctx.beginPath();
        ctx.moveTo(
            (point[0] - dataExtremes[0].min + 1) * (width / (dataRange[0] + 2) ),
            (point[1] - dataExtremes[1].min + 1) * (height / (dataRange[1] + 2) )
        );
        ctx.lineTo(
            (mean[0] - dataExtremes[0].min + 1) * (width / (dataRange[0] + 2) ),
            (mean[1] - dataExtremes[1].min + 1) * (height / (dataRange[1] + 2) )
        );
        ctx.stroke();
        ctx.closePath();

        ctx.restore();
    }

    var rgbFill;

    // draw points
    ctx.globalAlpha = 1;
    for (var i in data)
    {
        ctx.save();

        var point = data[i];

        var x = (point[0] - dataExtremes[0].min + 1) * (width / (dataRange[0] + 2) );
        var y = (point[1] - dataExtremes[1].min + 1) * (height / (dataRange[1] + 2) );

        ctx.strokeStyle = rgbClusterColor(  ''+assignments[i] );
        ctx.translate(x, y);
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI*2, true);
        ctx.stroke();
        ctx.closePath();

        ctx.restore();
    }

    // draw cluster centers (means)
    for (var i in means)
    {
        ctx.save();

        var point = means[i];

        var x = (point[0] - dataExtremes[0].min + 1) * (width / (dataRange[0] + 2) );
        var y = (point[1] - dataExtremes[1].min + 1) * (height / (dataRange[1] + 2) );


        // console.log("i = " + i + ", fill = " + rgbFill);

        ctx.fillStyle = rgbClusterColor( i );
        ctx.translate(x, y);
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI*2, true);
        ctx.fill();
        ctx.closePath();

        ctx.restore();

    }

}

function rgbClusterColor(nCluster)
{
    var rgb;

    switch ( nCluster )
    {
        case '0': rgb= 'green'; break;
        case '1': rgb= 'red'; break;
        case '2': rgb= 'blue'; break;
        case '3': rgb= 'orange'; break;
        case '4': rgb= 'cyan'; break;
        case '5': rgb= 'black'; break;
        case '6': rgb= 'grey'; break;
        default: rgb= 'rgb(255,0,255)';
    }

    return rgb;
}

setup();


function moveMeans() {

    var sums = Array( means.length );
    var counts = Array( means.length );
    var moved = false;

    // Clear location sums for each dimension
    for (var j in means)
    {
        counts[j] = 0;
        sums[j] = Array( means[j].length );
        for (var dimension in means[j])
        {
            sums[j][dimension] = 0;
        }
    }

    // for each cluster, get sum of point coordinates in every dimension
    for (var point_index in assignments)
    {
        var mean_index = assignments[point_index];
        var point = data[point_index];
        var mean = means[mean_index];

        counts[mean_index]++;

        for (var dimension in mean)
        {
            sums[mean_index][dimension] += point[dimension];
        }
    }

    // if cluster (means point) is not longer assigned ot any points
    //   move it somewhere else randomly within range of points
    for (var mean_index in sums)
    {
        // console.log(counts[mean_index]);
        if ( 0 === counts[mean_index] )
        {
            sums[mean_index] = means[mean_index];
            // console.log("Mean with no points");
            // console.log(sums[mean_index]);

            for (var dimension in dataExtremes)
            {
                sums[mean_index][dimension] = dataExtremes[dimension].min + ( Math.random() * dataRange[dimension] );
            }
            continue;
        }

        // find average of a cluster's points for every dimension
        for (var dimension in sums[mean_index])
        {
            sums[mean_index][dimension] /= counts[mean_index];
            sums[mean_index][dimension] = Math.round(100*sums[mean_index][dimension])/100;
        }
    }

    // console.log("means = " + means.toString());
    // console.log("sums = " + sums.toString());

    if (means.toString() != sums.toString())
    {
        var diff;
        moved = true;


        // nudge means 1/Nth of the way toward average point
        for ( var mean_index in sums )
        {
            for ( var dimension in sums[mean_index] )
            {
                diff = (sums[mean_index][dimension] - means[mean_index][dimension]);
                if ( Math.abs(diff) > 0.1 )
                {
                    means[mean_index][dimension] += diff / stepsPerIteration;
                    means[mean_index][dimension] = Math.round(100*means[mean_index][dimension])/100;
                }
                else
                {
                    means[mean_index][dimension] = sums[mean_index][dimension];
                }
            }
        }
    }

    // Replace mean points with averages of their members' coordinates
    //  Or, empty clusters are now at a random location
    // means = sums;

    return moved;

}