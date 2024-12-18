// in myFrontCallModule.js
"use strict";

modulum('FrontCallService.modules.myfcmodule', ['FrontCallService'],
    /**
     * @param {gbc} context
     * @param {classes} cls
     */
    function (context, cls) {
        context.FrontCallService.modules.myfcmodule = {

            beep: function (volume, frequency, type, duration) {

                // alert("beep_start");
                var AudioContext = window.AudioContext || window.webkitAudioContext;
                var audioCtx = new AudioContext();

                var oscillator = audioCtx.createOscillator();
                var gainNode = audioCtx.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioCtx.destination);

                gainNode.gain.value = volume;
                oscillator.frequency.value = frequency;
                oscillator.type = type;

                oscillator.start();

                setTimeout(
                    function () {
                        oscillator.stop();
                    },
                    duration
                );
                // alert("beep_end");
                return ["0"];
            },
            alert: function (){
                alert('hello')
            },
            getGeoLocation: function () {
               
                    if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(function (position) {
                            var latitude = position.coords.latitude;
                            var longitude = position.coords.longitude;
                            console.log('Latitude: ' + latitude + ', Longitude: ' + longitude);
                        }, function (error) {
                            console.error('Unable to retrieve location: ' + error.message);
                            return [error.message];
                        });
                    } else {
                        console.error('Geolocation is not supported by this browser.');
                    }
                    // return ["0"];
            },
            myCustomSyncFunction: function (name) {
                if (name === undefined) {
                  this.parametersError();
                  return;
                }
                if (name.length === 0) {
                  this.runtimeError("name shouldn't be empty");
                  return;
                }
                return ["Hello " + name + " !"];
              },
        
               replace_html: function (id, value) {
                  document.getElementById(id).innerHTML=value;
                  //return;
                  return ["0"];
              },
        
              myCustomAsyncFunction: function (name) {
                if (name === undefined) {
                  this.parametersError();
                  return;
                }
                if (name.length === 0) {
                  this.runtimeError("name shouldn't be empty");
                  return;
                }
        
                window.setTimeout(function () {
                  this.setReturnValues(["After 5s, Hello " + name + " !"]);
                }.bind(this), 5000);
              }
            

        };
    }
);