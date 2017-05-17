$(document).ready(function() {

  //close messages from flash message
  $('.message .close')
  .on('click', function() {
    $(this)
      .closest('.message')
      .transition('fade')
    ;
  });

  //make checkbox work
  $('.ui.checkbox')
  .checkbox();


$('.right.floated.time.meta').each(function() {
    var ms = parseInt($(this).text(), 10);
    let time = new Date(ms);
    $(this).text(humanized_time_span(time)); 
});

  //Sign Up Button
  $('.ui.big.green.labeled.icon.button.signup')
  .on('click', function() {
    window.location.href='/signup';
  });

  //this is the LIKE button
  $('.ui.animated.fade.button')
  .on('click', function() {
    $(this)
      .toggleClass( "red" )
    ;

     var postID = $(this).closest( ".ui.fluid.card.dim" ).attr( "postID" );
     var like = Date.now();
     console.log("***********LIKE: post "+postID+" at time "+like);
     $.post( "/feed", { postID: postID, like: like, _csrf : $('meta[name="csrf-token"]').attr('content') } );

  });

  //this is the FLAG button
  $('.ui.vertical.animated.button')
  .on('click', function() {

     var post = $(this).closest( ".ui.fluid.card.dim");
     var postID = post.attr( "postID" );
     var flag = Date.now();
     console.log("***********FLAG: post "+postID+" at time "+flag);
     $.post( "/feed", { postID: postID, flag: flag, _csrf : $('meta[name="csrf-token"]').attr('content') } );
     console.log("Removing Post content now!");
     post.find(".ui.dimmer.flag").dimmer({
                   closable: false
                  })
                  .dimmer('show');
    

  });

  //User wants to REREAD
  $('.ui.button.reread')
  .on('click', function() {
    //.ui.active.dimmer
    $(this).closest( ".ui.dimmer" ).removeClass( "active" );
    $(this).closest( ".ui.fluid.card.dim" ).find(".ui.inverted.read.dimmer").dimmer('hide');


     var postID = $(this).closest( ".ui.fluid.card.dim" ).attr( "postID" );
     var reread = Date.now();
     console.log("##########REREAD######SEND TO DB######: post "+postID+" at time "+reread);
     $.post( "/feed", { postID: postID, start: reread, _csrf : $('meta[name="csrf-token"]').attr('content') } );
     //maybe send this later, when we have a re-read event to time???
     //$.post( "/feed", { postID: postID, like: like, _csrf : $('meta[name="csrf-token"]').attr('content') } );

  });

  //Dimm cards as user scrolls - send Post to update DB on timing of events
  $('.ui.fluid.card.dim')
  .visibility({
    once       : false,
    continuous : false,


    //USER HAS NOW READ THE POST (READ EVENT)
    onBottomVisibleReverse:function(calculations) {
        console.log(":::::Now passing onBottomVisibleReverse:::::");

        //As Long as Dimmer is not Active and We have a UI condistion - Dimm screen and send Post READ event
        if (!($(this).dimmer('is active')) && ($(this).attr( "ui" )=='ui'))
        {
          console.log("::::UI passing::::DIMMING NOW::::::::");
          var postID = $(this).attr( "postID" );
          var read = Date.now();
          //actual dim the element
          $(this).find(".ui.inverted.read.dimmer").dimmer({
                   closable: false
                  })
                  .dimmer('show');
          //send post to server to update DB that we have now read this
          console.log("::::UI passing::::SENDING POST TO DB::::::::");
          $.post( "/feed", { postID: postID, read: read, _csrf : $('meta[name="csrf-token"]').attr('content') } );

        }

        //if we are not in UI condistion, and we are reading, then send off Post to DB for new Read Time
        //Maybe kill this so we don't fill the DB with all this stuff. Seems kind of silly (or only do like 10, etc)
        else if ($(this).attr( "ui" )=='no')
        {
          console.log("::::NO UI passing:::");
          var postID = $(this).attr( "postID" );
          var read = Date.now();
          //send post to server to update DB that we have now read this
          console.log("::::NO UI passing::::SENDING POST TO DB::::::::");
          $.post( "/feed", { postID: postID, read: read, _csrf : $('meta[name="csrf-token"]').attr('content') } );
        }

        //UI and DIMMED READ, which does not count as a READ
        else
          {console.log("::::passing::::Already dimmed - do nothing - OR NO UI");}

      },

    ////POST IS NOW Visiable - START EVENT
    onBottomVisible:function(calculations) {
        console.log("@@@@@@@ Now Seen @@@@@@@@@");
        
        //Post is not DIMMED (SO WE CAN SEE IT) - and We are in UI condistion - POST START EVENT to DB
        if (!($(this).dimmer('is active')) && ($(this).attr( "ui" )=='ui'))
        {
          var postID = $(this).attr( "postID" );
          var start = Date.now();
          console.log("@@@@@@@ UI!!!! @@@@@@SENDING TO DB@@@@@@START POST UI has seen post "+postID+" at time "+start);

          $.post( "/feed", { postID: postID, start: start, _csrf : $('meta[name="csrf-token"]').attr('content') } );
        }
        //if not UI, we still need to Update DB with new START time
        else if ($(this).attr( "ui" )=='no')
        {
          var postID = $(this).attr( "postID" );
          var start = Date.now();
          console.log("@@@@@@@ NO UI!!!! @@@@@@SENDING TO DB@@@@@@START@@@@@@@ POST has seen post "+postID+" at time "+start)
          $.post( "/feed", { postID: postID, start: start, _csrf : $('meta[name="csrf-token"]').attr('content') } );
        }

        else
          {console.log("@@@@@@@ Now Seen @@@@@@@@@  START Already dimmed - do nothing - OR NO UI");}

        }
  })
;//WTF!!!

'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function () {
  'use strict';

  var FileUploader = function () {
    function FileUploader() {
      _classCallCheck(this, FileUploader);
    }

    _createClass(FileUploader, [{
      key: 'cache',
      value: function cache() {
        this.$fileInput = document.querySelector('input');
        this.$img = document.querySelector('img');
        this.$label = document.querySelector('label');
      }
    }, {
      key: 'events',
      value: function events() {
        if(this.$fileInput && this.$img && this.$label)
        {
        this.$fileInput.addEventListener('change', this._handleInputChange.bind(this));
        this.$img.addEventListener('load', this._handleImageLoaded.bind(this));
        this.$label.addEventListener('dragenter', this._handleDragEnter.bind(this));
        this.$label.addEventListener('dragleave', this._handleDragLeave.bind(this));
        this.$label.addEventListener('drop', this._handleDrop.bind(this));
        }
      }
    }, {
      key: 'init',
      value: function init() {
        this.cache();
        this.events();
      }
    }, {
      key: '_handleDragEnter',
      value: function _handleDragEnter(e) {
        e.preventDefault();

        if (!this.$label.classList.contains('dragging')) {
          this.$label.classList.add('dragging');
        }
      }
    }, {
      key: '_handleDragLeave',
      value: function _handleDragLeave(e) {
        e.preventDefault();

        if (this.$label.classList.contains('dragging')) {
          this.$label.classList.remove('dragging');
        }
      }
    }, {
      key: '_handleDrop',
      value: function _handleDrop(e) {
        e.preventDefault();
        this.$label.classList.remove('dragging');

        this.$img.files = e.dataTransfer.files;
        this._handleInputChange();
      }
    }, {
      key: '_handleImageLoaded',
      value: function _handleImageLoaded() {
        if (!this.$img.classList.contains('loaded')) {
          this.$img.classList.add('loaded');
        }
      }
    }, {
      key: '_handleInputChange',
      value: function _handleInputChange(e) {
        var file = undefined !== e ? e.target.files[0] : this.$img.files[0];

        var pattern = /image-*/;
        var reader = new FileReader();

        if (!file.type.match(pattern)) {
          alert('invalid format');
          return;
        }

        this.$img.src = "";

        reader.onload = this._handleReaderLoaded.bind(this);

        if (this.$label.classList.contains('loaded')) {
          this.$label.classList.remove('loaded');
        }

        this.$label.classList.add('loading');

        reader.readAsDataURL(file);
      }
    }, {
      key: '_handleReaderLoaded',
      value: function _handleReaderLoaded(e) {
        var reader = e.target;
        this.$img.src = reader.result;
        this.$label.classList.remove('loading');
        this.$label.classList.add('loaded');
      }
    }]);

    return FileUploader;
  }();

  var fileUploader = new FileUploader();
  fileUploader.init();
})();


});