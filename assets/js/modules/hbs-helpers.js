/* globals Handlebars, Coins, Utils	*/
Handlebars.registerHelper('dateFormat', function(d) {
	'use strict';
	var options = { year: 'numeric', month: 'long', day: 'numeric' };
	return d ? new Date(d).toLocaleDateString('en-US', options) : d;
});

Handlebars.registerHelper('arrayFormat', function(a) {
	'use strict';
	return a.join(', ');
});

Handlebars.registerHelper('helpus', function(a, options) {
	'use strict';
	if('undefined' === typeof a || !a || a === "0") {
		return new Handlebars.SafeString('<a ' +
			'href="mailto:contact@coindevelopmentindex.com?subject=Development Team Info for ' +
			options.hash.coin + '"' +
			' title="Help us with your data!">?</a>');
	}
	return a;
});

Handlebars.registerHelper('trending', function(data, options) {
	'use strict';

	var inv = options.hash.inverse || false,
			mod = '',
			trend;

	if(data && data.length > 6 && data[0][options.hash.prop]) {

		trend = Utils.trend(data, options.hash.prop);

		// inverse for properties like rank where
		// negative trend = higher rank (lower number)
		if(inv) trend = trend * -1;

		if(trend === 0) return '';
		if(trend > 1) mod = 'rising';
		if(trend > 2.5) mod = 'rising2';
		if(trend > 5) mod = 'rising3';
		if(trend < -1) mod = 'falling';
		if(trend < -2.5) mod = 'falling2';
		if(trend < -5) mod = 'falling3';

		return new Handlebars.SafeString(
			'<span class="vs trending ' + mod + '">' +
				(trend > 0.5 ? 'Rising' : '') +
				(trend < -0.5 ? 'Falling' : '') +
			'</span>'
		);

	} else {
		return '';
	}
});

Handlebars.registerHelper('volatility', function(data) {
	'use strict';

	var vals, ret;

	if(data && data.length > 6) {
		vals = data.map(function(d) {
			return d.price;
		});
		ret = (Utils.vol(vals) * 100).toFixed(2);
	} else {
		ret = '';
	}

	if(!ret || Number.isNaN(ret) || ret === 0 || ret === 'NaN') ret = ''

	return ret;

});

Handlebars.registerHelper('latest', function(data, options) {
	'use strict';
	var ret = data && data[0] && data[0][options.hash.prop] ? data[0][options.hash.prop] : '-',
			pre = options.hash.prefix || '',
			fix = options.hash.prec || 0;

	if($.isNumeric(ret)) {
		if(fix === 'dynamic') fix = ret > 99 ? 2 : 4;
		if(ret === 0) return '-';
		return pre + ret.toFixed(fix);
	} else {
		return ret;
	}
});

Handlebars.registerHelper('change', function(data, options) {
	'use strict';
	var d0, d1, chg, pos,
			icn = '',
			cls = '',
			unit = options.hash.unit || '',
			icon = options.hash.icon || false,
			fix = options.hash.prec || 0,
			inv = options.hash.inverse || false;

	if(data && data.length > 1 && data[0][options.hash.prop]) {
		d0 = data[0][options.hash.prop];
		d1 = data[1][options.hash.prop];
	}

	if(!d0 || !d1) return '';

	chg = d0 - d1;

	if(chg === 0) return '';

	if(inv) chg = chg * -1;

	pos = chg > 0;
	if(fix === 'dynamic') fix = chg > 99 ? 2 : 4;
	if(unit === '%') chg = chg / d1 * 100;
	if(icon) icn = pos ? ' <i class="fa fa-level-up"></i>' : ' <i class="fa fa-level-down"></i>'
	cls = pos ? 'text-success' : 'text-danger';


	return new Handlebars.SafeString(
		'<span class="vs ' + cls + '">' + (pos ? '+' : '') +
		chg.toFixed(fix) + unit + icn +
		'</span>'
	);
});

Handlebars.registerHelper('all', function(data, options) {
	'use strict';
	var ret = data.some(function(d) { return d[options.hash.prop]; }) ?
							data.reduce(function(acc, d) {
								return acc + parseInt(d[options.hash.prop],10);
							}, 0) : '-',
			fix = options.hash.prec || 0;

	if($.isNumeric(ret)) {
		if(fix === 'dynamic') fix = ret > 99 ? 2 : 4;
		return ret.toFixed(fix);
	} else {
		return ret;
	}
});

Handlebars.registerHelper('vsindex', function(data, options) {
	'use strict';

	var prop = options.hash.prop,
			calcfield = options.hash.calcfield || false,
			type = options.hash.type || 'avg',
			fix = options.hash.prec || 0,
      trim = options.hash.trim || false,
			nonull = options.hash.nonull || false,
			unit = options.hash.unit || '',
			inv = options.hash.inverse || false,
			vs,
      vssign = '',
			out = '',
			color = '',
			val = 0,
			// passing true to nonull param includes only those with data
			idxAvg = Utils.avg(Coins.indexVals(prop, calcfield, nonull), trim),
      stddev = Utils.stddev(Coins.indexVals(prop, calcfield, nonull)),
			map;

	if(data && data.length) {

		switch(type) {

		case 'sum':
		case 'avg':
    case 'chg':
			map = data.slice().reverse().map(function(d) { return calcfield ? d[calcfield] : d[prop]; });
			val = Utils[type](map);
			break;

		case 'volatility':
			map = data.slice().reverse().map(function(d) { return d[calcfield]; });
			val = Utils.vol(map);
			break;

    case 'latest':
    default:
      val = data[0][prop];
      break;

    }
	}

	if(!val || Number.isNaN(val)) return '';

	vs = val - idxAvg;

  if(vs > idxAvg + stddev * 2) {
    out = 'Very&nbsp;High';
    color = inv ? 'text-danger' : 'text-success';
  } else if(vs > idxAvg + stddev) {
    out = 'High';
    color = inv ? 'text-warning' : 'text-info';
  } else if(vs < idxAvg - stddev * 2) {
    out = 'Very&nbsp;Low';
    color = inv ? 'text-success' : 'text-danger';
  } else if(vs < idxAvg - stddev) {
    out = 'Low';
    color = inv ? 'text-info' : 'text-warning';
  } else {
    out = 'Average';
  }

	if(vs > 0) vssign = '+';

  // if(type !== 'volatility') out += '&nbsp;(' + vssign + vs.toFixed(fix) + ')';

	return new Handlebars.SafeString(
		'<span class="vs ' + color + '">' + out + '</span>'
	);

});
