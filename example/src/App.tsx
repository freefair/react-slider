import React, {useRef} from 'react';

import { Slider, SliderRef, SliderAxis } from 'react-slider'
import 'react-slider/dist/index.css'
import styles from './App.module.css'

const App = () => {
  const sliderRef = useRef<SliderRef>()
  return (
    <div>
      <button onClick={() => sliderRef.current?.prevSlide()}>Prev</button>
      <Slider sliderRef={sliderRef} className={styles.slider} mouseTracking={true} axis={SliderAxis.X} visibleCount={4}>
        <div className={styles.slide} />
        <div className={styles.slide} />
        <div className={styles.slide} />
        <div className={styles.slide} />
        <div className={styles.slide} />
        <div className={styles.slide} />
        <div className={styles.slide} />
        <div className={styles.slide} />
      </Slider>
      <button onClick={() => sliderRef.current?.nextSlide()}>Next</button>
    </div>
  )
}

export default App
