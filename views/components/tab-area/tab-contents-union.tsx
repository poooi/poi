import type { RootState } from 'views/redux/reducer-factory'

import { isEqual, omit } from 'lodash-es'
import React, {
  Children,
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useState,
} from 'react'
import { useSelector } from 'react-redux'
import { css, styled } from 'styled-components'

const PoiTabContents = styled.div`
  flex: 1 0 0;
  overflow: hidden;
  position: relative;
  display: flex;
  height: 100%;
  width: 100%;
`

const PoiTabChildPositioner = styled.div<{
  transition?: boolean
  left?: boolean
  right?: boolean
  active?: boolean
}>`
  display: flex;
  flex: 1;
  flex-direction: column;
  position: absolute;
  width: 100%;
  height: 100%;
  transform: translate3d(0, 0, 0);
  ${({ transition }) =>
    transition &&
    css`
      transition: transform 0.3s 0.1s cubic-bezier(1, 0, 0, 1);
      will-change: transform;
    `}
  ${({ left, right }) =>
    left
      ? css`
          transform: translate3d(-100%, 0, 0);
          pointer-events: none;
        `
      : right &&
        css`
          transform: translate3d(100%, 0, 0);
          pointer-events: none;
        `}
  ${({ active }) =>
    !active &&
    css`
      & > * {
        display: none !important;
      }
    `}
`

const childrenKey = (children: React.ReactNode): string[] =>
  (
    Children.map(children, (child) =>
      React.isValidElement(child) ? String(child.key ?? '') : null,
    ) ?? []
  ).filter(Boolean) as string[]

const findChildByKey = (children: React.ReactNode, key: string): React.ReactNode =>
  (
    Children.map(children, (child) =>
      React.isValidElement(child) && child.key === key ? child : null,
    ) ?? []
  ).filter(Boolean)[0] ?? null

export interface TabContentsUnionHandle {
  childrenKey: () => string[]
  findChildByKey: (key: string) => React.ReactNode | null
}

interface Props {
  children: React.ReactNode
  activeTab: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TabContentsUnionInner = forwardRef<TabContentsUnionHandle, Props>(
  ({ children, activeTab }, ref) => {
    const enableTransition = useSelector(
      (state: RootState): boolean => state.config?.poi?.transition?.enable ?? true,
    )

    const [internalActiveTab, setInternalActiveTab] = useState(activeTab)
    const [prevTab, setPrevTab] = useState<string | null>(null)

    if (activeTab !== internalActiveTab) {
      setPrevTab(internalActiveTab)
      setInternalActiveTab(activeTab)
    }

    const handleTransitionEnd = useCallback(
      (key: string) => {
        if (prevTab === key) setPrevTab(null)
      },
      [prevTab],
    )

    useImperativeHandle(
      ref,
      () => ({
        childrenKey: () => childrenKey(children),
        findChildByKey: (key: string) => findChildByKey(children, key),
      }),
      [children],
    )

    const activeKey =
      internalActiveTab || (React.isValidElement(children) ? String(children.key ?? '') : '')

    let onTheLeft = true
    const content: React.ReactNode[] = []
    Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return
      const key = String(child.key ?? '')
      if (key === activeKey) onTheLeft = false
      content.push(
        <PoiTabChildPositioner
          key={key}
          className="poi-tab-child-positioner"
          transition={(key === activeKey || key === prevTab) && enableTransition}
          active={key === activeKey || key === prevTab}
          left={key !== activeKey && onTheLeft}
          right={key !== activeKey && !onTheLeft}
          onTransitionEnd={() => handleTransitionEnd(key)}
        >
          {child}
        </PoiTabChildPositioner>,
      )
    })

    return <PoiTabContents className="poi-tab-contents">{content}</PoiTabContents>
  },
)

TabContentsUnionInner.displayName = 'TabContentsUnion'

const propsAreEqual = (prev: Props, next: Props): boolean =>
  isEqual(omit(prev, ['children']), omit(next, ['children'])) &&
  isEqual(childrenKey(prev.children), childrenKey(next.children))

export const TabContentsUnion = memo(TabContentsUnionInner, propsAreEqual)
