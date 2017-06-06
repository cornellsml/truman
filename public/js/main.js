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

  //get add new reply post modal to show
  $('.reply.button').click(function () {
    
    let postID = $(this).closest( ".ui.fluid.card.dim" ).attr( "postID" );
    $('#replyInput').attr("value", postID);

    $(' .ui.small.reply.modal').modal('show');
});

  //get add new feed post modal to work
  $("#newpost, a.item.newpost").click(function () {
    $(' .ui.small.post.modal').modal('show');
});

  //new post validator (picture and text can not be empty)
  $('.ui.feed.form')
  .form({
    on: 'blur',
    fields: {
      body: {
        identifier  : 'body',
        rules: [
          {
            type   : 'empty',
            prompt : 'Please add some text about what you ate'
          }
        ]
      },
      picinput: {
        identifier  : 'picinput',
        rules: [
          {
            type: 'empty',
            prompt : 'Please click on Camera Icon to add a photo'
          }
        ]
      }
    }
  });

  $('.ui.reply.form')
  .form({
    on: 'blur',
    fields: {
      body: {
        identifier  : 'body',
        rules: [
          {
            type   : 'empty',
            prompt : 'Please add some text about what you ate'
          }
        ]
      }
    }
  })
;

function readURL(input) {
        if (input.files && input.files[0]) {
            var reader = new FileReader();
            //console.log("Now changing a photo");
            reader.onload = function (e) {
                $('#imgInp').attr('src', e.target.result);
                //console.log("FILE is "+ e.target.result);
            }
            
            reader.readAsDataURL(input.files[0]);
        }
    }
    
    $("#picinput").change(function(){
        //console.log("@@@@@ changing a photo");
        readURL(this);
    });

//add humanized time to all posts
$('.right.floated.time.meta, .date').each(function() {
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
  $('.like.button')
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
  $('.flag.button')
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



});