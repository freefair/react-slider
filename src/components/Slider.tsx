import React, {PropsWithChildren, ReactNode} from 'react';
import styles from './Slider.module.css';
import classNames from 'classnames';
import Timeout = NodeJS.Timeout;

export interface SliderRef {
  nextSlide(): void;

  prevSlide(): void;
}

export enum SliderAxis {
  // eslint-disable-next-line no-unused-vars
  X = 'X',
  Y = 'Y'
}

export interface SliderProps {
  sliderRef?: React.MutableRefObject<SliderRef | undefined> | undefined
  className?: string
  mouseTracking?: boolean
  maxTranslationOnEnd?: number,
  scrolltracking?: boolean
  visibleCount?: number
  gap?: string
  scrollMultiplier?: number,
  scrollTimeout?: number,
  scrollIgnoreTimeout?: number,
  scrollAvgNumber?: number,
  axis: SliderAxis,
  onPrevChanged?: (hasPrev: boolean) => void
  onNextChanged?: (hasNext: boolean) => void
}

export interface SliderState {
  tracking: boolean;
  wrapperStyles: any;
  currentX: number;
  currentY: number;
}

export default class Slider
  extends React.Component<PropsWithChildren<SliderProps>, SliderState>
  implements SliderRef {
  private readonly mainDivRef: React.RefObject<HTMLDivElement>;
  private readonly wrapperDivRef: React.RefObject<HTMLDivElement>;
  private startX: number = 0;
  private startY: number = 0;

  private timeoutRef: Timeout | null;

  public static defaultProps: SliderProps = {
    axis: SliderAxis.X,
    visibleCount: 1,
    mouseTracking: false,
    scrolltracking: true,
    scrollMultiplier: 1.5,
    scrollTimeout: 200,
    scrollIgnoreTimeout: 500,
    scrollAvgNumber: 15,
    maxTranslationOnEnd: 50,
    gap: '10px'
  }

  constructor(props: SliderProps = {axis: SliderAxis.X}) {
    super(props);
    if (props.sliderRef != null) {
      props.sliderRef.current = this;
    }
    this.state = {
      tracking: false,
      wrapperStyles: {
        gap: props.gap
      },
      currentX: 0,
      currentY: 0
    };
    this.mainDivRef = React.createRef();
    this.wrapperDivRef = React.createRef();
  }

  componentDidMount() {
    this.calculateStyles(false, 0, 0);
  }

  private touchStart(e: React.TouchEvent<any>) {
    const touch = e.touches.item(0);
    this.start(touch.clientX, touch.clientY)
  }

  private touchMove(e: React.TouchEvent<any>) {
    const touch = e.touches.item(0);
    this.move(touch.clientX, touch.clientY)
  }

  private touchEnd(_e: React.TouchEvent<any>) {
    this.end()
  }

  private mouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (this.props.mouseTracking) {
      this.start(e.clientX, e.clientY)
    }
  }

  private mouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (this.props.mouseTracking) {
      this.move(e.clientX, e.clientY)
    }
  }

  private mouseUp(_e: React.MouseEvent<HTMLDivElement>) {
    if (this.props.mouseTracking) {
      this.end()
    }
  }

  private wheelData: any[] = [];
  private lastWheelAvg: number = 0;
  private lowerSince: number = 0;
  private ignoreScrollsUntil: number = 0;
  private wheel(e: React.WheelEvent<HTMLDivElement>) {
    if(this.props.scrolltracking) {
      if (this.ignoreScrollsUntil > 0 && this.ignoreScrollsUntil > Date.now()) return;
      this.ignoreScrollsUntil = 0;

      let scrollMultiplier = this.props.scrollMultiplier ?? 1.5;
      this.calculateStyles(true, e.deltaX * scrollMultiplier, e.deltaY * scrollMultiplier);

      this.wheelData.push({time: Date.now(), x: e.deltaX, y: e.deltaY});
      if(this.wheelData.length > (this.props.scrollAvgNumber ?? 15)) {
        let avg = Math.abs(this.wheelData.reduce((a, b) => a + b.x, 0) / this.wheelData.length);
        if(this.props.axis == SliderAxis.Y) {
          avg = Math.abs(this.wheelData.reduce((a, b) => a + b.y, 0) / this.wheelData.length);
        }

        if(avg > this.lastWheelAvg) {
          this.lowerSince = 0;
        } else if(this.lowerSince == 0) {
          this.lowerSince = Date.now();
        }
        this.lastWheelAvg = avg;
        this.wheelData.shift();
      }

      if(this.lowerSince > 0) {
        if(Date.now() - this.lowerSince > (this.props.scrollTimeout ?? 200)) {
          this.ignoreScrollsUntil = this.lowerSince + (this.props.scrollIgnoreTimeout ?? 1000);
          this.lowerSince = 0;
          this.wheelData = [];
          this.calculateStyles(false, 0, 0);
          this.clearTimeout();
        }
      }

      this.setTimeout(() => {
        this.wheelData = [];
        this.calculateStyles(false, 0, 0);
      });
    }
  }

  private clearTimeout() {
    if(this.timeoutRef != null) {
      clearTimeout(this.timeoutRef);
    }
  }

  private setTimeout(callback: () => void) {
    this.clearTimeout();
    this.timeoutRef = setTimeout(() => {
      console.log("Timeout!");
      if(this.timeoutRef != null) {
        clearTimeout(this.timeoutRef);
        this.timeoutRef = null;
        callback();
      }
    }, 50);
  }

  private start(clientX: number, clientY: number) {
    this.setState({
      tracking: true
    });
    this.startX = clientX;
    this.startY = clientY;
  }

  private end() {
    this.setState({
      tracking: false
    });
    this.startX = 0;
    this.startY = 0;
    this.calculateStyles(false, 0, 0);
  }

  private move(clientX: number, clientY: number) {
    if (!this.state.tracking) return;
    const diffX = this.startX - clientX;
    const diffY = this.startY - clientY;

    this.startX = clientX;
    this.startY = clientY;

    this.calculateStyles(true, diffX, diffY);
  }

  private calculateStyles(tracking: boolean, diffX: number, diffY: number) {
    let referenceSize = this.mainDivRef.current?.clientWidth ?? 0;
    let elements = this.wrapperDivRef.current?.children.length ?? 0;
    let grid = this.props.visibleCount ?? 1;
    let diffXInPercent = diffX / referenceSize * 100;
    let diffYInPercent = diffY / referenceSize * 100;
    let currentX = this.state.currentX - diffXInPercent;
    let currentY = this.state.currentY - diffYInPercent;
    if (!tracking) {
      currentX = this.snapVal(currentX, grid, elements);
      currentY = this.snapVal(currentY, grid, elements);
    } else {
      currentX = this.preventBoundaries(currentX, diffXInPercent, grid, elements);
      currentY = this.preventBoundaries(currentY, diffYInPercent, grid, elements);
    }

    if (this.props.axis === SliderAxis.X) {
      currentY = 0;
    } else {
      currentX = 0;
    }

    if(!tracking && elements < grid) {
      currentY = 0;
      currentX = 0;
    }

    const styles = {
      ...this.state.wrapperStyles,
      transform: `translate3d(${currentX}%, ${currentY}%, 0)`,
      transition: tracking ? undefined : '.25s transform ease-in-out'
    };

    this.setState({
      currentX: currentX,
      currentY: currentY,
      wrapperStyles: styles
    });
    this.props.onPrevChanged?.(this.hasPrevSlide(currentX))
    this.props.onNextChanged?.(this.hasNextSlide(currentX))
  }

  private calculateMaxTranslation(gridWidth: number, elements: number, grid: number) {
    return (gridWidth * elements - gridWidth * grid) * -1;
  }

  private preventBoundaries(currentVal: number, diff: number, grid: number, elements: number) {
    const translationMax = (this.props.maxTranslationOnEnd ?? 50);
    if (currentVal > 0) {
      currentVal += diff / 1.5
      if(currentVal > translationMax) {
        currentVal = translationMax;
      }
    } else {
      const gridWidth = 100 / grid;
      const maxValue = this.calculateMaxTranslation(gridWidth, elements, grid);
      if (currentVal < maxValue) {
        currentVal += diff / 1.5
        if(currentVal < (maxValue - translationMax)) {
          currentVal = maxValue - translationMax;
        }
      }
    }
    return currentVal;
  }

  private snapVal(value: number, grid: number, elements: number) {
    const allowedGrid = 100 / grid;
    const number = (value * -1) % allowedGrid;
    if (number != 0) {
      if (number < allowedGrid / 2) {
        value += number;
      } else {
        value -= allowedGrid - number;
      }
    }

    if (value > 0) {
      value = 0;
    } else {
      let maxTranslation = this.calculateMaxTranslation(allowedGrid, elements, grid);
      if (value < maxTranslation) {
        value = maxTranslation
      }
    }

    return value;
  }

  public nextSlide() {
    if (this.props.axis === SliderAxis.X) {
      let gridWidth = (this.mainDivRef.current?.clientWidth ?? 0) / (this.props.visibleCount ?? 1)
      let number = this.calculateMaxTranslation(gridWidth, this.wrapperDivRef.current?.children.length ?? 0, this.props.visibleCount ?? 1);
      if (this.state.currentX > number) {
        this.calculateStyles(false, gridWidth, 0)
      }
    }
  }

  public prevSlide() {
    if (this.props.axis === SliderAxis.X) {
      if (this.state.currentX < 0) {
        this.calculateStyles(false, -(this.mainDivRef.current?.clientWidth ?? 0) / (this.props.visibleCount ?? 1), 0)
      }
    }
  }

  public hasNextSlide(currentX: number | null = null) {
    let gridWidth = (this.mainDivRef.current?.clientWidth ?? 0) / (this.props.visibleCount ?? 1)
    return (currentX ?? this.state.currentX) > this.calculateMaxTranslation(gridWidth, this.wrapperDivRef.current?.children.length ?? 0, this.props.visibleCount ?? 1);
  }

  public hasPrevSlide(currentX: number | null = null) {
    return (currentX ?? this.state.currentX) < 0;
  }

  renderChild(child:any, index: number):ReactNode {
    if(child.type != undefined) {
      return <child.type
        key={child.key || index}
        ref={child.ref} {...child.props}
        style={{minWidth: `calc(${100 / (this.props.visibleCount ?? 1)}% - ${this.props.gap})`}}>
        {/*child.props.children*/}
      </child.type>
    }
    if(Array.isArray(child)) {
      return child.map((child, index) => this.renderChild(child, index))
    }
    return child;
  }

  render() {
    return (
      <div
        className={classNames(this.props.className, styles.slider)}
        onTouchStart={(e) => this.touchStart(e)}
        onTouchEnd={(e) => this.touchEnd(e)}
        onTouchMove={(e) => this.touchMove(e)}
        onMouseDown={(e) => this.mouseDown(e)}
        onMouseMove={(e) => this.mouseMove(e)}
        onMouseUp={(e) => this.mouseUp(e)}
        onWheel={(e) => this.wheel(e)}
        onScroll={(e) => {e.preventDefault()}}
        ref={this.mainDivRef}
      >
        <div className={styles.sliderWrapper} style={this.state.wrapperStyles} ref={this.wrapperDivRef}>
          {/*@ts-expect-error*/}
          {this.props.children?.filter(c => c != null).map((child, index) => this.renderChild(child, index))}
        </div>
      </div>
    );
  }
}
