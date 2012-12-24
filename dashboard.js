(function() {
  var Mention, MentionView, Mentions, SaveSettingsView, Settings, appSettings, mentions, title, windowFocused;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  mentions = null;
  appSettings = null;
  title = '';
  windowFocused = true;
  chamberTypes = {
      'House': 'House',
      'Senate': 'Senate',
      'Extensions': 'House'
    };
  Mention = (function() {
    __extends(Mention, Backbone.Model);
    function Mention() {
      Mention.__super__.constructor.apply(this, arguments);
    }
    Mention.prototype.initialize = function() {
      this.set({
        url: this.get('origin_url')
      });
      this.set({
        capitolwords_url: this.get('capitolwords_url')
      });
      this.set({
        congress: this.get('congress')
      });
      this.set({
        chamber: chamberTypes[this.get('chamber')]
      });
      this.set({
        date: this.get('date')
      });
      this.set({
        title: this.get('title')
      });
      this.set({
        speaker: this.get('speaker_first') + ' ' + this.get('speaker_last')
      });
      this.set({
        speaker_state: this.get('speaker_state')
      });
      this.set({
        speaker_bioguide: "http://bioguide.congress.gov/scripts/biodisplay.pl?index="+this.get('bioguide_id')
      });
      this.set({
        party: this.get('speaker_party')
      });
      this.set({
        speaking: this.get('speaking')
      });
      this.set({
        view: new MentionView({
          model: this
        })
      });
      if (!this.get('initialLoad')) {
        return this.alert();
      }
    };
    Mention.prototype.requestPermission = function(callback) {
      return window.webkitNotifications.requestPermission(callback);
    };
    return Mention;
  })();
  Mentions = (function() {
    __extends(Mentions, Backbone.Collection);
    function Mentions() {
      Mentions.__super__.constructor.apply(this, arguments);
    }
    Mentions.prototype.model = Mention;
    Mentions.prototype.getMentions = function(initialLoad) {
      var newMentions;
      if (initialLoad == null) {
        initialLoad = false;
      }
      if (!(appSettings.get('apikey').length > 0)) {
        return;
      }
      newMentions = false;
      $.ajax({
        dataType: 'jsonp',
        url: 'http://capitolwords.org/api/text.json?phrase=new+york+times&start_date=2012-01-01&',
        data: {
          'apikey': $("#apikey").val()
        },
        success: __bind(function(data) {
          var result, _i, _len, _ref, _results;
          _ref = _.sortBy(data.results, function(r){ return r['date']}).reverse();
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            result = _ref[_i];
            _results.push(!this.get(result.id) ? (result = _(result).extend({
              id: result.id,
              timestamp: new Date(),
              initialLoad: initialLoad
            }), this.add(result), newMentions = true) : void 0);
          }
          return _results;
        }, this)
      });
      if (newMentions) {
        if (!initialLoad) {
          if (!windowFocused) {
            $("title").html("[*] " + title);
          }
        }
      }
      return setTimeout((__bind(function() {
        return this.getMentions();
      }, this)), 900000);
    };
    return Mentions;
  })();
  MentionView = (function() {
    __extends(MentionView, Backbone.View);
    function MentionView() {
      MentionView.__super__.constructor.apply(this, arguments);
    }
    MentionView.prototype.tagName = 'tr';
    MentionView.prototype.initialize = function() {
      this.template = _.template($("#filing-row-template").html());
      this.mobileTemplate = _.template($("#mobile-filing-row-template").html());
      return this.render();
    };
    MentionView.prototype.render = function() {
      var mobileEl;
      $(this.el).html(this.template(this.model.toJSON()));
      if (this.model.get('initialLoad')) {
        $("#filings tbody").append(this.el);
      } else {
        $("#filings tbody").prepend(this.el);
      }
      mobileEl = this.$el.clone();
      $(mobileEl).html(this.mobileTemplate(this.model.toJSON()));
      if (this.model.get('initialLoad')) {
        return $("#mobile-filings tbody").append(mobileEl);
      } else {
        return $("#mobile-filings tbody").prepend(mobileEl);
      }
    };
    return MentionView;
  })();
  Settings = (function() {
    __extends(Settings, Backbone.Model);
    function Settings() {
      Settings.__super__.constructor.apply(this, arguments);
    }
    Settings.prototype.defaults = {
      apikey: '',
      showNotifications: false
    };
    Settings.prototype.initialize = function() {
      var args;
      args = this.getQs();
      if (args.apikey != null) {
        $("#apikey").val(args.apikey);
        this.set({
          apikey: args.apikey
        });
      }
      return this.set({
        showNotifications: args.notify === 'true'
      });
    };
    Settings.prototype.getQs = function() {
      var args, k, pair, pairs, qs, v, _i, _len, _ref;
      qs = window.location.search.substring(1);
      pairs = qs.split('&');
      args = {};
      for (_i = 0, _len = pairs.length; _i < _len; _i++) {
        pair = pairs[_i];
        _ref = pair.split('='), k = _ref[0], v = _ref[1];
        args[k] = unescape(v);
      }
      return args;
    };
    Settings.prototype.save = function(callback) {
      this.set({
        apikey: $("#apikey").val(),
        showNotifications: $("#show-notifications").attr('checked') === 'checked'
      });
      if (this.get('apikey').length > 0) {
        window.location.search = "?apikey=" + (this.get('apikey')) + "&notify=" + (this.get('showNotifications'));
      }
      return mentions.getMentions(true);
    };
    return Settings;
  })();
  SaveSettingsView = (function() {
    __extends(SaveSettingsView, Backbone.View);
    function SaveSettingsView() {
      SaveSettingsView.__super__.constructor.apply(this, arguments);
    }
    SaveSettingsView.prototype.el = "#save-settings";
    SaveSettingsView.prototype.events = {
      'click': 'handleClick'
    };
    SaveSettingsView.prototype.handleClick = function(e) {
      e.preventDefault();
      return $("#settings").modal('hide');
    };
    return SaveSettingsView;
  })();
  $(document).ready(function() {
    title = $("title").html();
    mentions = new Mentions();
    appSettings = new Settings();
    mentions.getMentions(true);
    if (appSettings.get('apikey')) {
      $("#filing-content").show();
    } else {
      $("#welcome").show();
    }
    $("#settings").on('shown', function() {
      var saveSettingsView;
      saveSettingsView = new SaveSettingsView();
      if (appSettings.get('showNotifications') === true) {
        return $("#show-notifications").attr('checked', 'checked');
      }
    });
    $("#settings").on('hide', function() {
      return appSettings.save();
    });
    $("#update-now").bind('click', function() {
      return mentions.getMentions();
    });
    $("#welcome-enter-api-key").bind('click', function() {
      return $("#settings").modal('show');
    });
    $(window).blur(function() {
      return windowFocused = false;
    });
    $(window).focus(function() {
      return windowFocused = true;
    });
    return $(window).bind('focus', function() {
      return $("title").html(title);
    });
  });
}).call(this);
