import React, {useRef} from 'react';

import { Slider, SliderRef, SliderAxis } from 'react-slider'
import 'react-slider/dist/index.css'
import styles from './App.module.css'
import classNames from "classnames";

const App = () => {
  const sliderRef = useRef<SliderRef>()
  const sliderRef2 = useRef<SliderRef>()
  return (
    <div>
      <Slider sliderRef={sliderRef} className={styles.slider} mouseTracking={true} axis={SliderAxis.X} visibleCount={4}>
        <div className={classNames(styles.slide, styles.image1)}>
          <span className={classNames(styles.slideOverlay)}>Slide1</span>
        </div>
        <div className={classNames(styles.slide, styles.image2)}>
          <span className={classNames(styles.slideOverlay)}>Slide2</span>
        </div>
        <div className={classNames(styles.slide, styles.image3)}>
          <span className={classNames(styles.slideOverlay)}>Slide3</span>
        </div>
        <div className={classNames(styles.slide, styles.image1)}>
          <span className={classNames(styles.slideOverlay)}>Slide4</span>
        </div>
        <div className={classNames(styles.slide, styles.image2)}>
          <span className={classNames(styles.slideOverlay)}>Slide5</span>
        </div>
        <div className={classNames(styles.slide, styles.image3)}>
          <span className={classNames(styles.slideOverlay)}>Slide6</span>
        </div>
        <div className={classNames(styles.slide, styles.image1)}>
          <span className={classNames(styles.slideOverlay)}>Slide7</span>
        </div>
        <div className={classNames(styles.slide, styles.image2)}>
          <span className={classNames(styles.slideOverlay)}>Slide8</span>
        </div>
      </Slider>
      <button onClick={() => sliderRef.current?.prevSlide()}>Prev</button>
      <button onClick={() => sliderRef.current?.nextSlide()}>Next</button>
      <Slider sliderRef={sliderRef2} className={styles.slider2} mouseTracking={true} axis={SliderAxis.X} visibleCount={1}>
        <div className={classNames(styles.slide, styles.image1)}>
          <span className={classNames(styles.slideOverlay)}>Slide1</span>
        </div>
        <div className={classNames(styles.slide, styles.image2)}>
          <span className={classNames(styles.slideOverlay)}>Slide2</span>
        </div>
        <div className={classNames(styles.slide, styles.image3)}>
          <span className={classNames(styles.slideOverlay)}>Slide3</span>
        </div>
        <div className={classNames(styles.slide, styles.image1)}>
          <span className={classNames(styles.slideOverlay)}>Slide4</span>
        </div>
        <div className={classNames(styles.slide, styles.image2)}>
          <span className={classNames(styles.slideOverlay)}>Slide5</span>
        </div>
        <div className={classNames(styles.slide, styles.image3)}>
          <span className={classNames(styles.slideOverlay)}>Slide6</span>
        </div>
        <div className={classNames(styles.slide, styles.image1)}>
          <span className={classNames(styles.slideOverlay)}>Slide7</span>
        </div>
        <div className={classNames(styles.slide, styles.image2)}>
          <span className={classNames(styles.slideOverlay)}>Slide8</span>
        </div>
      </Slider>
      <button onClick={() => sliderRef2.current?.prevSlide()}>Prev</button>
      <button onClick={() => sliderRef2.current?.nextSlide()}>Next</button>
    </div>
  )
}

export default App
