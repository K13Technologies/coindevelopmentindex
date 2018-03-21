/*! UTILS */

var Utils = (function() {
	'use strict';

	/**
	 * Calculate standard deviation for array of values
	 */
	var standardDeviation = function(values) {

		var avg, squareDiffs, avgSquareDiff, stdDev;

		avg = average(values);

		squareDiffs = values.map(function(value) {
			var diff = value - avg,
					sqrDiff = diff * diff;
			return sqrDiff;
		});

		avgSquareDiff = average(squareDiffs);

		stdDev = Math.sqrt(avgSquareDiff);

		return stdDev;
	};

	/**
	 * Calculate standard deviation of an array of returns
	 */
	var volatility = function(values) {

		return standardDeviation(returns(values));

	};

	/**
	 * Average an array of returns
	 */
	var averageReturn = function(values) {

		return average(returns(values));

	};

	/**
	 * Calc returns for an array of values ( day over day )
	 */
	var returns = function(values) {

		var rets = [], i;

		for(i = 1; i < values.length; i++) {
			rets[i - 1] = values[i] / values[i - 1] - 1;
		}

		return rets;

	};

	/**
	 * Average an array of values, trim outliers of more than 3 stddevs
	 * 	if trim is true
	 */
	var average = function(values, trim) {

		var avg, stddev;

		trim = trim || false;

		avg = sum(values) / values.length;

		if(trim) {
			stddev = standardDeviation(values);
			values = values.filter(function(v) {
				return v <= avg + stddev * 3 && v >= avg - stddev * 3;
			});
			avg = sum(values) / values.length;
		}

		return avg;

	};

	/**
	 * Sum an array of values
	 */
	var sum = function(values) {

		return values.reduce(function(sum, value) {
			return sum + ($.isNumeric(value) ? value : 0);
		}, 0);

	};

	/**
	 * Returns the difference between first and last values of an array
	 * 	that are ordered chronologically
	 */
	var change = function(values) {
		return values[values.length - 1] - values[0];
	};

	/**
	 * Returns trend pos/neg for a given property in an array of objects
	 */
	var trend = function(data, prop) {

    var x = 0, y = 0, xy = 0, x2 = 0, i = 0, trend;

		data.forEach(function(d) {
    	var day = new Date(d.date).getTime()/1000/60/60/24,
	        val = d[prop] ? parseInt(d[prop],10) : null,
	        wr = day * val,
	        ws = day * day;

      if(val) {
        x += day;
        y += val;
        xy += wr;
        x2 += ws;
        i++;
      }
    });

    return ((i * xy) - (x * y)) / ((i * x2) - (x * x)).toFixed(10);
	};

	return {
		sum: sum,
		avg: average,
		chg: change,
		avgrtn: averageReturn,
		stddev: standardDeviation,
		trend: trend,
		vol: volatility
	};

})();
