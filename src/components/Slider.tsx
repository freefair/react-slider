import React, {PropsWithChildren} from 'react';
import styles from './Slider.module.css';
import classNames from 'classnames';

export interface SliderRef {
  nextSlide(): void;
  prevSlide(): void;
  hasPrevSlide(): void;
  hasNextSlide(): void;
}

export enum SliderAxis {
  // eslint-disable-next-line no-unused-vars
  X = 'X',
  // eslint-disable-next-line no-unused-vars
  // Y = 'Y'
}

export interface SliderProps {
  sliderRef?: React.MutableRefObject<SliderRef | undefined> | undefined
  className?: string
  mouseTracking?: boolean
  visibleCount?: number
  gap?: string
  axis: SliderAxis
}

export interface SliderState {
  tracking: boolean;
  wrapperStyles: any;
}

export default class Slider
  extends React.Component<PropsWithChildren<SliderProps>, SliderState>
  implements SliderRef {
  private readonly mainDivRef: React.RefObject<HTMLDivElement>;
  private readonly wrapperDivRef: React.RefObject<HTMLDivElement>;
  private startX: number = 0;
  private startY: number = 0;
  private currentX: number = 0;
  private currentY: number = 0;

  public static defaultProps: SliderProps = {
    axis: SliderAxis.X,
    visibleCount: 1,
    mouseTracking: false,
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
      }
    };
    this.mainDivRef = React.createRef();
    this.wrapperDivRef = React.createRef();
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

    this.currentX -= diffX;
    this.currentY -= diffY;

    if (this.props.axis === SliderAxis.X) {
      this.currentY = 0;
    } else {
      this.currentX = 0;
    }

    this.startX = clientX;
    this.startY = clientY;

    this.calculateStyles(true, diffX, diffY);
  }

  private calculateStyles(tracking: boolean, diffX: number, diffY: number) {
    let referenceSize = this.mainDivRef.current?.clientWidth ?? 0;
    let elements = this.wrapperDivRef.current?.children.length ?? 0;
    let grid = this.props.visibleCount ?? 1;
    if (!tracking) {
      this.currentX = this.snapVal(this.currentX, referenceSize, grid, elements);
      this.currentY = this.snapVal(this.currentY, referenceSize, grid, elements);
    } else {
      this.currentX = this.preventBoundaries(this.currentX, diffX, referenceSize, grid, elements);
      this.currentY = this.preventBoundaries(this.currentY, diffY, referenceSize, grid, elements);
    }

    const styles = {
      ...this.state.wrapperStyles,
      transform: `translate3d(${this.currentX}px, ${this.currentY}px, 0)`,
      transition: tracking ? undefined : '.25s transform ease-in-out'
    };

    this.setState({
      wrapperStyles: styles
    });
  }

  private calculateMaxTranslation(gridWidth: number, elements: number, grid: number) {
    return (gridWidth * elements - gridWidth * grid) * -1;
  }

  private preventBoundaries(currentVal: number, diff: number, referenceSize: number, grid: number, elements: number) {
    if (currentVal > 0) {
      currentVal += diff / 1.5
    } else {
      const gridWidth = referenceSize / grid;
      const maxValue = this.calculateMaxTranslation(gridWidth, elements, grid);
      if (currentVal < maxValue) {
        currentVal += diff / 1.5
      }
    }
    return currentVal;
  }

  private snapVal(value: number, referenceSize: number, grid: number, elements: number) {
    const allowedGrid = referenceSize / grid;
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
    if(this.props.axis === SliderAxis.X) {
      let gridWidth = (this.mainDivRef.current?.clientWidth ?? 0) / (this.props.visibleCount ?? 1)
      if (this.currentX >= this.calculateMaxTranslation(gridWidth, this.wrapperDivRef.current?.children.length ?? 0, this.props.visibleCount ?? 1)) {
        this.currentX -= gridWidth
        this.calculateStyles(false, 0, 0)
      }
    }
  }

  public prevSlide() {
    if(this.props.axis === SliderAxis.X) {
      if (this.currentX < 0) {
        this.currentX += (this.mainDivRef.current?.clientWidth ?? 0) / (this.props.visibleCount ?? 1)
        this.calculateStyles(false, 0, 0)
      }
    }
  }

  public hasNextSlide() {
    let gridWidth = (this.mainDivRef.current?.clientWidth ?? 0) / (this.props.visibleCount ?? 1)
    return this.currentX >= this.calculateMaxTranslation(gridWidth, this.wrapperDivRef.current?.children.length ?? 0, this.props.visibleCount ?? 1);
  }

  public hasPrevSlide() {
    return this.currentX < 0;
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
        ref={this.mainDivRef}
      >
        <div className={styles.sliderWrapper} style={this.state.wrapperStyles} ref={this.wrapperDivRef}>
          {/*@ts-expect-error*/}
          {this.props.children?.map((child, index) => <child.type key={child.key || index}
                                                                  ref={child.ref} {...child.props}
                                                                  style={{minWidth: `calc(${100 / (this.props.visibleCount ?? 1)}% - ${this.props.gap})`}}>
            {child.props.children}
          </child.type>)}
        </div>
      </div>
    );
  }
}
