import React, { useState, useEffect } from "react"

import * as Binder from '@livelybone/mouse-wheel'


interface FPSProps {
  animationDuration?: number
  animationTiming?: string
  animationTranform?: string

  pagination?: boolean
  keyboard?: boolean

  touch?: boolean
  touchLimit?: number

  loop?: boolean

  onLeave?: (index: number) => void
  afterLoad?: (index: number) => void
}

const defaults = {
  animationDuration: 700,
  animationTiming: 'ease',
  animationTranform: 'transform',

  pagination: true,
  keyboard: true,

  touch: true,
  touchLimit: 100,

  loop: false,

  onLeave: null,
  afterLoad: null,
};

const isIE = () => {
  var myNav = navigator.userAgent.toLowerCase();
  return (myNav.indexOf('msie') != -1) ? parseInt(myNav.split('msie')[1]) : false;
}

const lcFirst = (str: string) => str.charAt(0).toLowerCase() + str.slice(1)

const addVendors = (obj: { [index: string] : string }, property: string, value: string) => {
  const vendors = {
    [lcFirst(property)]: value,
    ['Webkit' + property]: value,
    ['Moz' + property]: value,
    ['Ms' + property]: value,
    ['O' + property]: value,
  }
  return { ...obj, ...vendors }
}

const addStyle = (obj: { [index: string] : string }, property: string, value: string) => {
  return {...obj, [lcFirst(property)]: value}
}

let lastAnimation = 0


const FullPageScroller: React.FC<FPSProps> = (props) => {

  let { children } = props
  const settings = {...defaults, ...props}

  const initialStyle: React.CSSProperties = { "height": "100vh" }
  const [ containerStyle, setStyle ] = useState(initialStyle)

  const containerRef = React.createRef<HTMLDivElement>()

  /******************************
          init             
  *******************************/
  const [ index, setIndex ] = useState(0)
  // this.build();  <-- pagination html
    // this.makeActive(this.index);

  /******************************
          bind events             
  *******************************/
  useEffect(() => {
    let unbind: any
    if (settings.keyboard) {
      document.addEventListener('keydown', handleKeyboard);
      unbind = Binder.bind(mousewheel)
    }
    return () => {
      unbind && unbind()
      document.removeEventListener('keydown', handleKeyboard);
    }
  })


  if (settings.touch) {
    enableTouch();
  }

  // document.addEventListener('wheel', mousewheel);
  // document.addEventListener('mousewheel', mousewheel);
  // document.addEventListener('DOMMouseScroll', mousewheel);

  if (typeof settings.afterLoad === 'function') {
    settings.afterLoad(index);
  }

  /******************************
          inputs             
  *******************************/
  function enableTouch() {
      if (!containerRef.current) return

      var startCoords = 0;
      var endCoords = 0;
      var distance = 0;
    
      containerRef.current.addEventListener('touchstart', function(event) {
        startCoords = event.changedTouches[0].pageY;

      });

      containerRef.current.addEventListener('touchmove', function(event) {
        event.preventDefault();

      });

      containerRef.current.addEventListener('touchend', function(event) {
        var time = new Date().getTime();

        endCoords = event.changedTouches[0].pageY;
        distance = endCoords - startCoords;

        if (time - Math.abs(lastAnimation) < settings.animationDuration) {
          return;
        }

        if ((distance < 0) && (Math.abs(distance) > settings.touchLimit)) {
          moveDown();

        } else if ((distance > 0) && (Math.abs(distance) > settings.touchLimit)) {
          moveUp();
        }

        lastAnimation = time
      });
    };

    function mousewheel(event: any) {
      if (event.type !== "wheelStart") return
      console.log("mouse wheeled", event);
        var time = new Date().getTime();
        // var delta = event.wheelDelta || -event.detail;
        var delta = -event.dy;

        console.log("timeout calc", time - Math.abs(lastAnimation), settings.animationDuration);
        if (time - Math.abs(lastAnimation) < settings.animationDuration) {
          console.log("not moving");
          return;
        }
        lastAnimation = time;

      console.log("mouse wheeled compare", delta);
        if (delta < 0) {
          moveDown();
        } else {
          moveUp();
        }


      };
 

  /******************************
          event handlers             
  *******************************/
  function handleKeyboard(event: KeyboardEvent) {

    var time = new Date().getTime();

    if (time - Math.abs(lastAnimation) < settings.animationDuration) return 

    if (event.keyCode === 38) {
      moveUp()
    }

    if (event.keyCode === 40) {
      moveDown()
    }

    lastAnimation = time
  }

  /******************************
          movement             
  *******************************/
  const moveUp = () => {
    if (index > 0) {
      move(index - 1);
    }
  }

  const moveDown = () => {
    console.log("move down");
    if ((index + 1) < React.Children.count(children)) {
      move(index + 1);
    }
  }

  const move = (nextIndex: number) => {
      var time = new Date().getTime();
      lastAnimation = time  
      console.log("move requested to", nextIndex);

      let nextStyle: { [index: string]: string } = {}

      if (typeof settings.onLeave === 'function') {
        settings.onLeave(index);

      }

      if (isIE() === 9) {
        nextStyle = addStyle(nextStyle, "position", "relative")
        // utils.setStyle(this.el, 'position', 'relative');
        nextStyle = addStyle(nextStyle, "top", nextIndex * -100 + '%')
        // utils.setStyle(this.el, 'top', index * -100 + '%');
        // utils.setVendor(this.el, 'Transform', 'translate3d(0, ' + index * -100 + '%, 0)');
        nextStyle = addVendors(nextStyle, 'Transition', 'transform ' + settings.animationDuration + 'ms');
      }

      nextStyle = addVendors(nextStyle, 'Transform', 'translate3d(0, ' + nextIndex * -100 + '%, 0)');
      nextStyle = addVendors(nextStyle, 'Transition', 'transform ' + settings.animationDuration + 'ms');

      var checkEnd = function() {
        if (typeof settings.afterLoad === 'function') {
          settings.afterLoad(nextIndex);
        }
      };

      containerRef.current && containerRef.current.addEventListener('transitionend', checkEnd);

      setIndex(nextIndex)
      setStyle({...containerStyle, ...nextStyle})

      //  makeActive(index); pagination thing
    }

  return <div className="full-page-scroller-container" style={{ "overflow": "hidden", "height": "100vh" }}>
  <div className="full-page-scroller" style={containerStyle} ref={containerRef}>
    { React.Children.map( children, child => <div className='full-page-scroller__section' style={{ "height": "100%" }}>
      { child }
    </div>)}
  </div>
  </div>
}

export default FullPageScroller
