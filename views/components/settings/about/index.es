import React from 'react'

import { VersionInfo } from './version-info'
import { AppMetrics } from './app-metrics'
import { OpenCollective } from './open-collective'
import { GPUStatus } from './gpu-status'
import { Update } from './update'
import { Contributors } from './contributors'
import { ThanksTo } from './thanks-to'

export const About = () => (
  <div>
    <VersionInfo />
    <Update />
    <GPUStatus />
    <AppMetrics />
    <OpenCollective />
    <Contributors />
    <ThanksTo />
  </div>
)
