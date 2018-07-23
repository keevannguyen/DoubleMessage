var express = require("express");
var router = express.Router();

var models = require("../models/models");
var User = models.User;
var Contact = models.Contact;
var Message = models.Message;

// Twilio Credentials
var accountSid = process.env.TWILIO_SID;
var authToken = process.env.TWILIO_AUTH_TOKEN;
var fromNumber = process.env.MY_TWILIO_NUMBER;
var twilio = require('twilio');
var client = new twilio(accountSid, authToken);

// POST Receive Message with Twilio Request From Webhooks
router.post("/messages/receive", function(req, res, next) {
  console.log(req.body);
  User.findOne( { phone: req.body.To }, function(err, user) {
    if (err)
    {
      next(err);
    }
    else
    {
      Contact.findOne( { owner: user._id, phone: req.body.From.slice(2) }, function(err, contact) {
        if (err)
        {
          next(err);
        }
        else
        {
          new Message({
            created: new Date(),
            content: req.body.Body,
            user: user._id,
            contact: contact._id,
            channel: "SMS",
            status: "received",
            from: req.body.From
          }).save( function(err) {
            if (err)
            {
              next(err);
            }
            else
            {
              res.end();
            }
          });
        }
      });
    }
  });
});

// Make Sure User is Logged In
router.use("/", function(req, res, next) {
  if (!req.user)
  {
    res.redirect("/login");
  }
  else
  {
    next();
  }
});

// GET Contacts Page
router.get("/contacts", function(req, res, next) {
  Contact.find( { owner: req.user._id }, function(err, contacts) {
    if (err)
    {
      next(err);
    }
    else
    {
      res.render("contacts", {
        contacts: contacts
      });
    }
  });
});

// GET Make New Contact Page
router.get("/contacts/new", function(req, res, next) {
  res.render("editContact");
});

// POST Make New Contact Request
router.post("/contacts/new", function(req, res, next) {
  if ( !req.body.name || !req.body.phone )
  {
    res.status(404);
  }
  else
  {
    new Contact({
      name: req.body.name,
      phone: req.body.phone,
      owner: req.user._id
    }).save( function(err) {
      if (err)
      {
        next(err);
      }
      else
      {
        res.redirect("/contacts");
      }
    });
  }
});

// GET Edit Contact Page
router.get("/contacts/:id", function(req, res, next) {
  Contact.findById(req.params.id, function(err, contact) {
    if (err)
    {
      next(err);
    }
    else
    {
      res.render('editContact', {
        contact: contact
      });
    }
  });
});

// POST Edit Contact Request
router.post("/contacts/:id", function(req, res, next) {
  Contact.findById(req.params.id, function(err, contact) {
    if (err)
    {
      next(err);
    }
    else
    {
      contact.name = req.body.name;
      contact.phone = req.body.phone;
      contact.save( function(err) {
        if (err)
        {
          next(err);
        }
        else
        {
          res.redirect("/contacts");
        }
      })
    }
  });
});

// GET All Messages From User Page
router.get("/messages", function(req, res, next) {
  Message.find( { user: req.user._id } ).populate("contact").exec( function(err, messages) {
    if (err)
    {
      next(err);
    }
    else
    {
      res.render("messages", {
        messages: messages
      });
    }
  });
});

var formattedDate = function(date) {
   var month = String( date.getMonth() + 1 );
   month = month.length === 1 ? "0" + month : month;

   var day = String( date.getDate() );
   day = day.length === 1 ? "0" + day : day;

   var year = String( date.getFullYear() );

   var time = date.toLocaleTimeString('en-us',{timeZoneName:'short'}).split(" ");
   time = time[0] + time[1] + " " + time[2];

   return month + "/" + day + "/" + year + " at " + time;
}

// GET All Messages to Contact Page
router.get("/messages/:contactId", function(req, res, next) {
  Contact.findById( req.params.contactId , function(err, contact) {
    if (err)
    {
      next(err);
    }
    else
    {
      Message.find( { user: req.user._id, contact: req.params.contactId } ).populate("contact").exec( function(err, messages) {
        if (err)
        {
          next(err);
        }
        else
        {
          res.render("messages", {
            contactName: contact.name,
            messages: messages.map( function(msg){ msg.formattedDate = formattedDate(msg.created); return msg; } )
          });
        }
      });
    }
  });
});

// GET Send Message to Contact Page
router.get("/messages/send/:contactId", function(req, res, next) {
  Contact.findById( req.params.contactId , function(err, contact) {
    if (err)
    {
      next(err);
    }
    else
    {
      res.render("newMessage", {
        contactName: contact.name,
      });
    }
  });
});

// POST Send Message to Contact with Twilio Request
router.post("/messages/send/:contactId", function(req, res, next) {
  Contact.findById( req.params.contactId , function(err, contact) {
    if (err)
    {
      next(err);
    }
    else
    {
      var data = {
        body: req.body.message,
        to: "+1" + contact.phone,
        from: fromNumber
      };
      client.messages.create(data, function(err, msg) {
        if (err)
        {
          next(err);
        }
        else
        {
          new Message({
            created: msg.dateCreated,
            content: msg.body,
            user: req.user._id,
            contact: req.params.contactId,
            channel: "SMS",
            status: "sent",
          }).save( function(err) {
            if (err)
            {
              next(err);
            }
            else
            {
              res.redirect("/messages/" + req.params.contactId);
            }
          });
        }
      });
    }
  });
});

module.exports = router;
