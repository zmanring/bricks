(function() {
  var Brick, Score, brick, score,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  Score = (function() {
    function Score() {
      this.modalContent = $('.modal .content');
      this.submitted = false;
      $('.add').on('click', (function(_this) {
        return function() {
          if (!_this.submitted) {
            _this.add($('.name').val(), brick.getScore());
          }
          $('.modal label').hide();
          $('.add').hide();
          return _this.submitted = true;
        };
      })(this));
    }

    Score.prototype.connect = function() {
      this.firebase = new Firebase('https://bricks.firebaseio.com/');
      return this.getLeaders();
    };

    Score.prototype.getLeaders = function() {
      return this.firebase.child('leaderboards').on('value', (function(_this) {
        return function(snapshot) {
          return _this.displayLeaderboard(snapshot.val());
        };
      })(this));
    };

    Score.prototype.add = function(name, score) {
      var epoch;
      if (name == null) {
        name = 'anonymous';
      }
      epoch = (new Date).getTime();
      return this.firebase.child('leaderboards').child(epoch).set({
        name: name,
        score: score,
        time: epoch
      });
    };

    Score.prototype.toArray = function(data) {
      var arr, key, obj;
      arr = [];
      for (key in data) {
        obj = data[key];
        arr.push(obj);
      }
      return _.sortBy(arr, 'score').reverse();
    };

    Score.prototype.displayLeaderboard = function(data) {
      var html, i, leader, leadersArray, len;
      leadersArray = this.toArray(data);
      html = '<ul>';
      for (i = 0, len = leadersArray.length; i < len; i++) {
        leader = leadersArray[i];
        html += '<li><p>' + leader.name + '<span>' + leader.score + '</span></p></li>';
      }
      html += '</ul>';
      return this.modalContent.html(html);
    };

    return Score;

  })();

  Brick = (function() {
    function Brick() {
      this.startSideToSide = bind(this.startSideToSide, this);
      this.body = $('body');
      this.brickCount = 0;
      this.brickHeightInPercent = 3;
      this.delayInSeconds = .8;
      this.dropButton = $('button.drop');
      this.main = $('main');
      this.modal = $('.modal');
      this.window = $(window);
      this.create();
      this.dropButton.on('click', (function(_this) {
        return function() {
          _this.dropButton.attr('disabled', 'disabled');
          return _this.drop();
        };
      })(this));
      $('.reload').on('click', function() {
        return location.reload();
      });
    }

    Brick.prototype.create = function(width) {
      if (width == null) {
        width = '50%';
      }
      this.main.prepend('<div class="brick current" style="width:' + width + '"></div>');
      return this.startSideToSide();
    };

    Brick.prototype.startSideToSide = function() {
      this.currentBrickElem = $('.current');
      this.currentBrickWidth = this.currentBrickElem.width();
      this.currentWindowWidth = this.window.width();
      this.sideToSideTl = new TimelineLite({
        onComplete: this.startSideToSide
      });
      this.sideToSideTl.to(this.currentBrickElem, this.delayInSeconds, {
        left: this.currentWindowWidth - this.currentBrickWidth,
        ease: Linear.easeNone
      });
      return this.sideToSideTl.to(this.currentBrickElem, this.delayInSeconds, {
        left: 0,
        ease: Linear.easeNone
      });
    };

    Brick.prototype.getScore = function() {
      return this.brickCount;
    };

    Brick.prototype.percentFromLeft = function() {
      var fromLeftInPercent, fromLeftInPx;
      fromLeftInPx = this.currentBrickElem.offset().left;
      fromLeftInPercent = (fromLeftInPx / this.main.width()) * 100;
      this.currentBrickElem.css({
        left: fromLeftInPercent + '%'
      });
      return fromLeftInPercent;
    };

    Brick.prototype.stopSideToSide = function() {
      return this.sideToSideTl.stop();
    };

    Brick.prototype.unbind = function() {
      return this.currentBrickElem.removeClass('current');
    };

    Brick.prototype.calculateOffset = function() {
      var currentBrickInPercentage, currentBrickOffsetInPercentage, currentWidthOffset;
      currentBrickOffsetInPercentage = this.percentFromLeft();
      currentBrickInPercentage = this.currentBrickWidth / this.currentWindowWidth * 100;
      currentWidthOffset = currentBrickInPercentage - Math.abs(currentBrickOffsetInPercentage - this.previousBrickOffsetInPercentage);
      this.newWidth = Math.abs(currentWidthOffset) + '%';
      if (currentWidthOffset > 0) {
        this.currentBrickElem.css({
          width: this.newWidth,
          left: this.previousBrickOffsetInPercentage > currentBrickOffsetInPercentage ? this.previousBrickOffsetInPercentage + '%' : currentBrickOffsetInPercentage + '%'
        });
      }
      return currentWidthOffset;
    };

    Brick.prototype.calculatePoints = function() {
      this.brickCount++;
      this.body.attr('data-points', this.brickCount);
      $('.score').attr('data-points', this.brickCount);
      return $('head title').text('Bricks (' + this.brickCount + ')');
    };

    Brick.prototype.gameOver = function() {
      this.body.attr('data-points', 'GAME OVER!');
      this.dropButton.text(':(');
      score.connect();
      return this.modal.show();
    };

    Brick.prototype.drop = function() {
      this.stopSideToSide();
      this.dropTl = new TimelineLite({
        onComplete: (function(_this) {
          return function() {
            var currentWidthOffset;
            currentWidthOffset = _this.calculateOffset();
            if (currentWidthOffset < 0) {
              return _this.gameOver();
            } else {
              _this.unbind();
              _this.calculatePoints();
              _this.dropButton.removeAttr('disabled');
              _this.previousBrickOffsetInPercentage = _this.percentFromLeft();
              _this.previousBrickWidth = _this.currentBrickWidth;
              _this.delayInSeconds = _this.delayInSeconds / 1.01;
              if (_this.brickCount <= 1) {
                return _this.create();
              } else {
                return _this.create(_this.newWidth);
              }
            }
          };
        })(this)
      });
      return this.dropTl.to(this.currentBrickElem, 1, {
        bottom: this.brickCount * this.brickHeightInPercent + '%',
        ease: Bounce.easeOut
      });
    };

    return Brick;

  })();

  brick = new Brick();

  score = new Score();

}).call(this);