import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import dailyPlanService from '../services/dailyPlanService';
import toast from 'react-hot-toast';

// Dynamic sequential time slot calculator helper
export const recalculateTaskTimeSlots = (tasks, sessionStart = null) => {
  if (!Array.isArray(tasks) || tasks.length === 0) return [];

  let baseDate = new Date();
  if (sessionStart) {
    baseDate = new Date(sessionStart);
  } else if (tasks[0]?.time && typeof tasks[0].time === 'string' && tasks[0].time.includes('-')) {
    const match = tasks[0].time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (match) {
      let [_, hStr, mStr, meridiem] = match;
      let h = parseInt(hStr, 10);
      const m = parseInt(mStr, 10);
      if (meridiem.toUpperCase() === 'PM' && h < 12) h += 12;
      if (meridiem.toUpperCase() === 'AM' && h === 12) h = 0;
      baseDate.setHours(h, m, 0, 0);
    } else {
      const mins = baseDate.getMinutes();
      baseDate.setMinutes(Math.ceil(mins / 5) * 5, 0, 0);
    }
  } else {
    const mins = baseDate.getMinutes();
    baseDate.setMinutes(Math.ceil(mins / 5) * 5, 0, 0);
  }

  let currentMinutesOffset = 0;

  return tasks.map((t) => {
    const dur = Math.max(1, Number(t.duration) || 30);
    const s = new Date(baseDate.getTime() + currentMinutesOffset * 60000);
    const e = new Date(baseDate.getTime() + (currentMinutesOffset + dur) * 60000);

    const fmt = (d) =>
      d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    currentMinutesOffset += dur;

    return {
      ...t,
      duration: dur,
      time: `${fmt(s)} - ${fmt(e)}`,
    };
  });
};

export const useDailyPlanStore = create(
  persist(
    (set, get) => ({
      // UI Controls
      isModalOpen: false,
      isBubbleVisible: true,
      step: 'greeting', // 'greeting' | 'input' | 'compare' | 'edit' | 'session' | 'report' | 'history'

      // Form State
      mode: 'grind', // 'chill' | 'grind' | 'allin'
      totalHours: 4,
      subjects: [
        { name: 'DSA - Graphs', type: 'revision' },
        { name: 'Operating Systems', type: 'revision' },
      ],
      meals: 1,
      breaks: 2,
      powerNap: false,
      beverage: 'chai',

      // AI Generated Plans
      generatedOptions: null, // { planA, planB, matchedSheets }
      selectedPlanChoice: 'planA', // 'planA' | 'planB'
      isGenerating: false,

      // Active Plan from Server
      currentPlan: null, // Document from DailyPlan model
      history: [],
      isLoadingHistory: false,

      // Modal Triggers: Resumes exactly where the user left off
      openModal: (targetStep) => {
        const state = get();
        if (targetStep) {
          set({ isModalOpen: true, step: targetStep });
        } else if (state.currentPlan?.status === 'active') {
          set({ isModalOpen: true, step: 'session' });
        } else if (state.currentPlan?.status === 'completed' && state.currentPlan?.report) {
          set({ isModalOpen: true, step: 'report' });
        } else if (state.currentPlan?.plan?.tasks?.length > 0) {
          set({ isModalOpen: true, step: state.step || 'edit' });
        } else if (state.generatedOptions) {
          set({ isModalOpen: true, step: state.step || 'compare' });
        } else {
          set({ isModalOpen: true, step: state.step || 'greeting' });
        }
      },

      closeModal: () => set({ isModalOpen: false }),
      setStep: (step) => set({ step }),
      setBubbleVisible: (visible) => set({ isBubbleVisible: visible }),

      // Form setters
      setMode: (mode) => set({ mode }),
      setTotalHours: (totalHours) => set({ totalHours }),
      setSubjects: (subjects) => set({ subjects }),
      addSubject: (subject) =>
        set((state) => ({ subjects: [...state.subjects, subject] })),
      removeSubject: (index) =>
        set((state) => ({
          subjects: state.subjects.filter((_, i) => i !== index),
        })),
      setMeals: (meals) => set({ meals }),
      setBreaks: (breaks) => set({ breaks }),
      setPowerNap: (powerNap) => set({ powerNap }),
      setBeverage: (beverage) => set({ beverage }),

      // AI Plan Generation
      generatePlans: async () => {
        const { mode, totalHours, subjects, meals, breaks, powerNap, beverage } = get();
        set({ isGenerating: true });
        try {
          const data = await dailyPlanService.generate({
            mode,
            totalHours,
            subjects,
            meals,
            breaks,
            powerNap,
            beverage,
          });

          // Ensure both plans have cleanly sequenced time slots
          if (data.planA?.tasks) {
            data.planA.tasks = recalculateTaskTimeSlots(data.planA.tasks);
          }
          if (data.planB?.tasks) {
            data.planB.tasks = recalculateTaskTimeSlots(data.planB.tasks);
          }

          set({
            generatedOptions: data,
            selectedPlanChoice: 'planA',
            isGenerating: false,
            step: 'compare',
          });
          toast.success('✨ 2 AI Study Plans generated!');
        } catch (error) {
          console.error('Plan Generation Error:', error);
          set({ isGenerating: false });
          toast.error(error.response?.data?.message || 'Failed to generate plans with AI');
        }
      },

      // Select Plan A or B and proceed to Editable View
      selectPlan: (choice) => {
        const { generatedOptions } = get();
        if (!generatedOptions) return;
        const chosenPlan = choice === 'planB' ? generatedOptions.planB : generatedOptions.planA;
        const altPlan = choice === 'planB' ? generatedOptions.planA : generatedOptions.planB;

        const tasksWithTime = recalculateTaskTimeSlots(chosenPlan.tasks || []);
        const totalAllocatedMinutes = tasksWithTime.reduce((acc, t) => acc + (Number(t.duration) || 0), 0);

        set({
          selectedPlanChoice: choice,
          currentPlan: {
            mode: get().mode,
            totalHours: Number((totalAllocatedMinutes / 60).toFixed(1)) || get().totalHours,
            subjects: get().subjects,
            meals: get().meals,
            breaks: get().breaks,
            powerNap: get().powerNap,
            beverage: get().beverage,
            plan: {
              ...JSON.parse(JSON.stringify(chosenPlan)),
              tasks: tasksWithTime,
            },
            altPlan: JSON.parse(JSON.stringify(altPlan)),
            status: 'draft',
            durationSecondsPlanned: totalAllocatedMinutes * 60,
          },
          step: 'edit',
        });
      },

      // Update task list in editor (auto-recalculates sequential times & total planned duration)
      updateLocalTasks: async (newTasks, title) => {
        const { currentPlan } = get();
        if (!currentPlan) return;

        // Auto-recalculate sequential time slots for all tasks
        const sequencedTasks = recalculateTaskTimeSlots(newTasks, currentPlan.sessionStartedAt);
        const totalAllocatedMinutes = sequencedTasks.reduce((acc, t) => acc + (Number(t.duration) || 0), 0);

        const updatedPlan = {
          ...currentPlan,
          totalHours: Number((totalAllocatedMinutes / 60).toFixed(1)),
          durationSecondsPlanned: totalAllocatedMinutes * 60,
          plan: {
            ...currentPlan.plan,
            title: title !== undefined ? title : currentPlan.plan.title,
            tasks: sequencedTasks,
          },
        };

        set({ currentPlan: updatedPlan });

        // If saved on backend, sync tasks and duration
        if (currentPlan._id) {
          try {
            await dailyPlanService.updateTasks(currentPlan._id, sequencedTasks, title);
          } catch (err) {
            console.error('Sync tasks error:', err);
          }
        }
      },

      // Start Non-Stop Session
      startSession: async () => {
        const { currentPlan, mode, totalHours, subjects, meals, breaks, powerNap, beverage } = get();
        if (!currentPlan?.plan?.tasks) return;

        try {
          let planDoc = currentPlan;
          // If not saved on backend yet, save draft first
          if (!planDoc._id) {
            planDoc = await dailyPlanService.save({
              mode,
              totalHours,
              subjects,
              meals,
              breaks,
              powerNap,
              beverage,
              chosenPlan: currentPlan.plan,
              altPlan: currentPlan.altPlan,
            });
          }

          // Start session
          const activeDoc = await dailyPlanService.startSession(planDoc._id);
          set({
            currentPlan: activeDoc,
            step: 'session',
            isBubbleVisible: true,
          });
          toast.success('🚀 Non-stop study session started! Lock in.');
        } catch (error) {
          console.error('Start session error:', error);
          toast.error(error.response?.data?.message || 'Failed to start session');
        }
      },

      // Toggle Task Complete / Incomplete
      toggleTask: async (taskId) => {
        const { currentPlan } = get();
        if (!currentPlan?.plan?.tasks) return;

        // Optimistic update
        const updatedTasks = currentPlan.plan.tasks.map((t) =>
          t.id === taskId ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date() : null } : t
        );

        set({
          currentPlan: {
            ...currentPlan,
            plan: { ...currentPlan.plan, tasks: updatedTasks },
          },
        });

        if (currentPlan._id) {
          try {
            const updated = await dailyPlanService.toggleTask(currentPlan._id, taskId);
            set({ currentPlan: updated });
          } catch (err) {
            console.error('Toggle task error:', err);
          }
        }
      },

      // End Session and Show Report
      endSession: async () => {
        const { currentPlan } = get();
        if (!currentPlan?._id) return;

        try {
          const completedDoc = await dailyPlanService.endSession(currentPlan._id);
          set({
            currentPlan: completedDoc,
            step: 'report',
          });
          toast.success('🎉 Session complete! Pat yourself on the back.');
          get().fetchHistory();
        } catch (error) {
          console.error('End session error:', error);
          toast.error(error.response?.data?.message || 'Failed to finish session');
        }
      },

      // Fetch active session or initial state from server
      fetchActiveSession: async () => {
        try {
          const active = await dailyPlanService.getActive();
          if (active && active.status === 'active') {
            set({ currentPlan: active, step: 'session' });
          } else if (active && !get().currentPlan?._id && !get().generatedOptions) {
            set({ currentPlan: active });
          }
        } catch (err) {
          console.warn('Fetch active plan error:', err);
        }
      },

      // Fetch History of Completed Sessions
      fetchHistory: async () => {
        set({ isLoadingHistory: true });
        try {
          const history = await dailyPlanService.getHistory();
          set({ history: history || [], isLoadingHistory: false });
        } catch (err) {
          console.error('Fetch history error:', err);
          set({ isLoadingHistory: false });
        }
      },

      // Repeat an existing plan from history or current session (Let's do this again)
      repeatPlan: (planToRepeat) => {
        if (!planToRepeat?.plan?.tasks) return;
        const tasksWithNewTimes = recalculateTaskTimeSlots(planToRepeat.plan.tasks);
        const totalAllocatedMinutes = tasksWithNewTimes.reduce(
          (acc, t) => acc + (Math.max(1, Number(t.duration)) || 0),
          0
        );

        set({
          mode: planToRepeat.mode || 'grind',
          totalHours: Number((totalAllocatedMinutes / 60).toFixed(1)) || planToRepeat.totalHours || 4,
          subjects: planToRepeat.subjects || [],
          meals: planToRepeat.meals !== undefined ? planToRepeat.meals : 1,
          breaks: planToRepeat.breaks !== undefined ? planToRepeat.breaks : 2,
          powerNap: planToRepeat.powerNap || false,
          beverage: planToRepeat.beverage || 'chai',
          currentPlan: {
            mode: planToRepeat.mode || 'grind',
            totalHours: Number((totalAllocatedMinutes / 60).toFixed(1)) || 4,
            subjects: planToRepeat.subjects || [],
            meals: planToRepeat.meals || 1,
            breaks: planToRepeat.breaks || 2,
            powerNap: planToRepeat.powerNap || false,
            beverage: planToRepeat.beverage || 'chai',
            plan: {
              title: planToRepeat.plan.title || 'My Study Plan',
              tasks: tasksWithNewTimes.map((t) => ({ ...t, completed: false, completedAt: null })),
            },
            status: 'draft',
            durationSecondsPlanned: totalAllocatedMinutes * 60,
          },
          step: 'edit',
        });
        toast.success("🔁 Plan loaded! Let's do this again.");
      },

      // Reset to create a new session
      createNewPlan: () => {
        set({
          currentPlan: null,
          generatedOptions: null,
          step: 'greeting',
        });
      },
    }),
    {
      name: 'trackasap-daily-plan-storage-v3',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        step: state.step,
        mode: state.mode,
        totalHours: state.totalHours,
        subjects: state.subjects,
        meals: state.meals,
        breaks: state.breaks,
        powerNap: state.powerNap,
        beverage: state.beverage,
        generatedOptions: state.generatedOptions,
        selectedPlanChoice: state.selectedPlanChoice,
        currentPlan: state.currentPlan,
        isBubbleVisible: state.isBubbleVisible,
      }),
    }
  )
);

export default useDailyPlanStore;
