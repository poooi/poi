import { Button, Icon, Position, Tooltip } from '@blueprintjs/core'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { styled } from 'styled-components'

const HintBar = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 2px;
  padding: 1px 2px 1px 6px;
  border-radius: 3px;
  background: rgb(45 114 210 / 0.18);
  font-size: 12px;
`

const HintText = styled.span`
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

/**
 * A one-shot pointer at a right-click menu, which is otherwise undiscoverable:
 * a right-click target looks exactly like one that is not.
 *
 * Presentational on purpose — where the dismissal is stored is the caller's
 * business, so each hint can keep its config path typed against the real
 * config shape rather than reaching into it by string.
 */
export const ContextMenuHint = ({
  text,
  dismissed,
  onDismiss,
  className,
}: {
  text: string
  dismissed: boolean
  onDismiss: () => void
  className?: string
}) => {
  const { t } = useTranslation('main')
  if (dismissed) return null

  return (
    <HintBar className={className}>
      <Icon icon="info-sign" size={12} />
      <HintText title={text}>{text}</HintText>
      <Tooltip content={t('main:Got it')} position={Position.TOP}>
        <Button minimal small icon="cross" onClick={onDismiss} />
      </Tooltip>
    </HintBar>
  )
}
