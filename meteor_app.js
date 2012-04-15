Windows = new Meteor.Collection("windows");
Tabs = new Meteor.Collection("tabs");
Fields = new Meteor.Collection("fields");

if (Meteor.is_client) {
  var okcancel_events = function (selector) {
    return 'keyup '+selector+', keydown '+selector+', focusout '+selector;
  };

  // Creates an event handler for interpreting "escape", "return", and "blur"
  // on a text field and calling "ok" or "cancel" callbacks.
  var make_okcancel_handler = function (options) {
    var ok = options.ok || function () {};
    var cancel = options.cancel || function () {};

    return function (evt) {
      if (evt.type === "keydown" && evt.which === 27) {
        // escape = cancel
        cancel.call(this, evt);

      } else if (evt.type === "keyup" && evt.which === 13 ||
                 evt.type === "focusout") {
        // blur/return/enter = ok/submit if non-empty
        var value = String(evt.target.value || "");
        if (value)
          ok.call(this, value, evt);
        else
          cancel.call(this, evt);
      }
    };
  };



  Template.showcase.win = getCurrentWindow;
  Template.showcase.currentTabs = getCurrentTabs;

  Template.sidebar.windows = function () {
    return Windows.find({}, {sort: {name: 1}});
  };

  Template.sidebar.events = {};
  Template.sidebar.events[okcancel_events('#window-name')] = make_okcancel_handler({
    'ok': function(value, evt) {
      var windowName = value;
      if (windowName) {        
        evt.target.value = '';
        var win = Windows.insert({name: windowName, tabs: []});
        reset();
        setCurrentWindow(Windows.findOne(win));
      }  
    }
  });

  Template.sidebar.events[okcancel_events('#tab-name')] = make_okcancel_handler({
    'ok': function(value, evt) {
      var tabName = $('#tab-name').val();
      if (tabName) {
        $('#tab-name').val('');
        var tab = Tabs.insert({name: tabName, fields: []});
        var win = getCurrentWindow();
        win.tabs.push(tab);
        Windows.update(win._id, {$push: {tabs: tab}});        
        setCurrentTabs(win);
        setCurrentTab(Tabs.findOne(tab));
      }    
    }
  });

  Template.sidebar.events[okcancel_events('#field-name')] = make_okcancel_handler({
    'ok': function(value, evt) {      
      if (value) {
        evt.target.value = '';
        var field = Fields.insert({name: value});
        var tab = getCurrentTab();
        Tabs.update(tab._id, {$push: {fields: field}});                
        setCurrentTabs(getCurrentWindow());
      }    
    }
  });


  Template.windowItem.active = function() {
    var current_window = getCurrentWindow();
    return current_window && current_window._id == this._id ? 'active' : '';
  };

  Template.windowItem.getTab = getTab;

  Template.windowItem.events = {
    'click .window-remove' : function () {
      var windowId = this._id;
      this.tabs.forEach(function(t){
        var tab = getTab(t);
        Fields.remove({_id: {$in: tab.fields}});
        Tabs.remove(tab);
      });

      Tabs.remove({_id: {$in: this.tabs}});
      Windows.remove(this);
      reset();
    },
    'click *' : function () {
      setCurrentWindow(this);
    }
  };


  Template.navTab.active = function() {
    return getCurrentTab() && getCurrentTab()._id == this._id ? 'active' : '';
  };

  Template.tabPane.visible = function() {
    return getCurrentTab() && getCurrentTab()._id == this._id ? 'block' : 'none';
  };

  Template.navTab.events = {
    'click' : function () {
      $('.nav-tab-item').removeClass('active');
      $('#' + this._id).addClass('active');
      setCurrentTab(this);
    }
  };


  Template.tab.getField = getField;
  Template.tab.active = function() {
    var current_tab = getCurrentTab();
    return current_tab && current_tab._id == this._id ? 'active' : '';
  };


  Template.tab.events = {
    'click .tab-item a' : function() {
      setCurrentTab(this);
    },
    'click .tab-remove' : function () {
      var tabId = this._id;
      Tabs.remove(this);
      Fields.remove({_id : {$in: this.fields}});
      var currentWindow = getCurrentWindow();
      Windows.update(currentWindow._id, {$pull: {tabs: tabId}});
      currentWindow.tabs.splice(currentWindow.tabs.indexOf(tabId), 1);
      setCurrentTabs(currentWindow);
    }
  };

  Template.field.events = {
    'click .field-item a' : function(evt) {
      $('.field-item').removeClass('active');
      $(evt.target).parent().addClass('active');
    },
    'click .field-remove' : function () {
      var fieldId = this._id;
      Fields.remove(this);
      var currentTab = getCurrentTab();
      Tabs.update(currentTab._id, {$pull: {fields: fieldId}});
      currentTab.fields.splice(currentTab.fields.indexOf(fieldId), 1);
      setCurrentTab(currentTab);
    }
  };

  Template.tabPane.getField = getField;

  function getCurrentWindow () {
    return Session.get("current_window"); 
  }

  function setCurrentWindow(win) {
    Session.set("current_window", win);
    setCurrentTabs(win);
    
  }

  function reset() {
    setCurrentWindow(null);
    setCurrentTab(null);
    setCurrentTabs(null);
  }

  function setCurrentTab(tab) {
    Session.set("current_tab", tab);
  }

  function getCurrentTab() {
    return Session.get("current_tab");
  }

  function getTab(tabId) {
    return Tabs.findOne(tabId);
  }

  function getField(fieldId) {
    return Fields.findOne(fieldId);
  }

  function getFieldName(fieldId) {
    var field = getField(fieldId);
    return field && field.name;
  }

  function getTabName(tabId) {
    var tab = getTab(tabId);
    return tab && tab.name;
  }

  function setCurrentTabs(win) {    
    var tabs = [];
    if (win) {
      win.tabs.forEach(function(t){
        var tab = getTab(t);
        if (tab) {        
          tabs.push(tab);
        }
      });
    }    

    Session.set('current_tabs', tabs);
  }

  function getCurrentTabs() {
    return Session.get("current_tabs");
  }
  
}

if (Meteor.is_server) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}