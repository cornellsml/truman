$(document).ready(function() {

  //close messages from flash message
  $('.message .close')
  .on('click', function() {
    $(this)
      .closest('.message')
      .transition('fade')
    ;
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
    $(this)
      .toggleClass( "red" )
    ;

     var postID = $(this).closest( ".ui.fluid.card.dim" ).attr( "postID" );
     var flag = Date.now();
     console.log("***********FLAG: post "+postID+" at time "+flag);
     $.post( "/feed", { postID: postID, flag: flag, _csrf : $('meta[name="csrf-token"]').attr('content') } );

  });

  //User wants to REREAD
  $('.ui.button.reread')
  .on('click', function() {
    //.ui.active.dimmer
    $(this).closest( ".ui.dimmer" ).removeClass( "active" );
    $(this).closest( ".ui.fluid.card.dim" ).dimmer('hide');


     var postID = $(this).closest( ".ui.fluid.card.dim" ).attr( "postID" );
     var reread = Date.now();
     console.log("***********REREAD: post "+postID+" at time "+reread);
     //maybe send this later, when we have a re-read event to time???
     //$.post( "/feed", { postID: postID, like: like, _csrf : $('meta[name="csrf-token"]').attr('content') } );

  });

  //Dimm cards as user scrolls - send Post to update DB on timing of events
  $('.ui.fluid.card.dim')
  .visibility({
    once       : false,
    continuous : false,

    onBottomVisibleReverse:function(calculations) {
        console.log(":::::Now passing onBottomVisibleReverse:::::");
        if (!($(this).dimmer('is active')) && ($(this).attr( "ui" )=='ui'))
        {
          console.log("::::passing::::DIMMING NOW::::::::");
          var postID = $(this).attr( "postID" );
          var read = Date.now();
          //actual dim the element
          $(this).dimmer({
                   closable: false
                  })
                  .dimmer('show');
          //send post to server to update DB that we have now read this
          console.log("::::passing::::SENDING POST TO DB::::::::");
          $.post( "/feed", { postID: postID, read: read, _csrf : $('meta[name="csrf-token"]').attr('content') } );

        }
        else
          {console.log("::::passing::::Already dimmed - do nothing - OR NO UI");}

      },

    onBottomVisible:function(calculations) {
        // do something at 30%
        console.log("::::::::::Now Seen::::::::::");
        //console.log("Now Seen :::: Dimmer is now: "+$(this).dimmer('is active'));
        if (!($(this).dimmer('is active')) && ($(this).attr( "ui" )=='ui'))
        {
          var userID = $(this).attr( "user" );
          var postID = $(this).attr( "postID" );
          var start = Date.now();
          console.log("@@@@@@@@@@@@START POST - User "+userID+" has seen post "+postID+" at time "+start);
          //console.log("Token is "+ $('meta[name="csrf-token"]').attr('content'));
          //add start time to postActions for this user. post to /feed/
          /*
          cat.post = req.body.postID;
          cat.startTime = req.body.start;
          */

          $.post( "/feed", { postID: postID, start: start, _csrf : $('meta[name="csrf-token"]').attr('content') } );
        }
        else
          {console.log("@@@@@@@START Already dimmed - do nothing - OR NO UI");}

        }
      


  })
;



});