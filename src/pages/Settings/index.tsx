import AdvancedSetting from '@/pages/Typing/components/Setting/AdvancedSetting'
import DataSetting from '@/pages/Typing/components/Setting/DataSetting'
import SoundSetting from '@/pages/Typing/components/Setting/SoundSetting'
import ViewSetting from '@/pages/Typing/components/Setting/ViewSetting'
import { Tab } from '@headlessui/react'
import classNames from 'classnames'
import IconAdjustmentsHorizontal from '~icons/tabler/adjustments-horizontal'
import IconDatabaseCog from '~icons/tabler/database-cog'
import IconEar from '~icons/tabler/ear'
import IconEye from '~icons/tabler/eye'

export default function SettingsPage() {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden px-8 pb-6 pt-7">
      <div className="mb-6">
        <h1 className="font-['Noto_Sans_SC'] text-3xl font-black tracking-tight text-slate-800 dark:text-slate-100">设置</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">在这里统一管理声音、练习行为、显示和数据备份</p>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/70">
        <Tab.Group vertical>
          <div className="flex h-full min-h-0">
            <Tab.List className="flex w-56 shrink-0 flex-col gap-2 border-r border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-700/70 dark:bg-slate-900/70">
              <Tab
                className={({ selected }) =>
                  classNames(
                    'flex h-12 items-center gap-2 rounded-lg px-3 text-left text-sm text-slate-600 focus:outline-none dark:text-slate-300',
                    selected && 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200',
                  )
                }
              >
                <IconEar className="h-4 w-4" />
                <span>音效设置</span>
              </Tab>
              <Tab
                className={({ selected }) =>
                  classNames(
                    'flex h-12 items-center gap-2 rounded-lg px-3 text-left text-sm text-slate-600 focus:outline-none dark:text-slate-300',
                    selected && 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200',
                  )
                }
              >
                <IconAdjustmentsHorizontal className="h-4 w-4" />
                <span>高级设置</span>
              </Tab>
              <Tab
                className={({ selected }) =>
                  classNames(
                    'flex h-12 items-center gap-2 rounded-lg px-3 text-left text-sm text-slate-600 focus:outline-none dark:text-slate-300',
                    selected && 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200',
                  )
                }
              >
                <IconEye className="h-4 w-4" />
                <span>显示设置</span>
              </Tab>
              <Tab
                className={({ selected }) =>
                  classNames(
                    'flex h-12 items-center gap-2 rounded-lg px-3 text-left text-sm text-slate-600 focus:outline-none dark:text-slate-300',
                    selected && 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200',
                  )
                }
              >
                <IconDatabaseCog className="h-4 w-4" />
                <span>数据设置</span>
              </Tab>
            </Tab.List>

            <Tab.Panels className="min-h-0 flex-1">
              <Tab.Panel className="flex h-full min-h-0 focus:outline-none">
                <SoundSetting />
              </Tab.Panel>
              <Tab.Panel className="flex h-full min-h-0 focus:outline-none">
                <AdvancedSetting />
              </Tab.Panel>
              <Tab.Panel className="flex h-full min-h-0 focus:outline-none">
                <ViewSetting />
              </Tab.Panel>
              <Tab.Panel className="flex h-full min-h-0 focus:outline-none">
                <DataSetting />
              </Tab.Panel>
            </Tab.Panels>
          </div>
        </Tab.Group>
      </div>
    </div>
  )
}
