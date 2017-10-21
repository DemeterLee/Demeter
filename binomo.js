RATE = 68
TURBO_LEFT_TIME = 30 * 1000
BINARY_LEFT_TIME = 5 * 60 * 1000
BEFORE_CLOSE_MS = 5 * 1000

DEFAULT_BET = 100
DEBUG_MODE = false
SAFE_BET = true

CANVAS_SCOPE = angular.element('.binomo-trading-canvas').scope()
ASIDE_SCOPE = angular.element('[binomo-summ-selector]').scope()

var lastTimeout = null
var isFirstQuery = true

nowFormated = function() {
	return moment().format('DD.MM HH:mm:ss')
}

logger = function() {
	args = Array.from(arguments)
	console.log(nowFormated(), args.join(', '))
}

debug = function() {
	args = Array.from(arguments)
	if (DEBUG_MODE) {
		console.log(nowFormated(), args.join(', '))
	}
}

getMeanPercent = function(type) {
	return parseInt($('.percents.' + type).text())
}

checkMean = function() {
	pos = getMeanPercent('positive')
	neg = getMeanPercent('negative')

	debug("checkMean")

	if (Math.max(pos, neg) > RATE) {
		if (pos > neg) {
			return "positive"
		} else {
			return "negative"
		}
	}
	return false
}

makeQuery = function(type) {
	logger("makeQuery - " + type)
  
	placeBet()
	debug("placeBet - success")  
  
	scope = angular.element(".btn-column-sm-m").scope()
	scope.vm[type + 'Query']({
		originalEvent: {
			isTrusted: true
		}
	})
	isFirstQuery = false
}

isLastWin = function() {
	firstChildren = $('.bets-slider').children().first()
	if (firstChildren.hasClass("bet-active")) {
		throw "last bet is active"
	}
	return firstChildren.hasClass('bet-won')
}

getLoseCoof = function() {
	pr = ASIDE_SCOPE.vm.getPaymentRate()
	lr = 100 - pr
	return 1 + (lr / 100)
}

setBet = function(amount) {
	amount = Math.round(amount)
	debug("setBet", amount)
	ASIDE_SCOPE.vm.summ = amount
	ASIDE_SCOPE.$apply()
}

getCurrentBet = function() {
	return ASIDE_SCOPE.vm.summ
}

placeBet = function() {
	if (isFirstQuery || isLastWin()) {
		setBet(DEFAULT_BET)
	} else {
		if (SAFE_BET) {
			newBet = getCurrentBet() * 2
		} else {
			newBet = (getCurrentBet() * 2) * getLoseCoof()
		}
		setBet(newBet)
	}
}

mainRunner = function() {
	debug("mainRunner")

	switch (checkMean()) {
		case "positive":
			makeQuery('up')
			break
		case "negative":
			makeQuery('down')
			break
		case false:
			logger("checkMean - pass")
			break
	}
}

CANVAS_SCOPE.$watch("time", function(timeObject) {
	clearTimeout(lastTimeout)

	if (timeObject.isTurbo()) {
		leftTime = TURBO_LEFT_TIME
	} else {
		leftTime = BINARY_LEFT_TIME
	}

	nowUnixtime = (new Date()).valueOf()
	expiriedAt = timeObject.valueOf()
	runAfterMs = expiriedAt - nowUnixtime - leftTime - BEFORE_CLOSE_MS

	if (runAfterMs > 0) {
		lastTimeout = setTimeout(mainRunner, runAfterMs)
		debug("timeout for mainRunner setted", runAfterMs / 1000)
	} else {
		debug("runAfterMs <= 0")
	}
})
