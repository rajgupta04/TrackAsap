import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import dailyPlanService from '../services/dailyPlanService';
import toast from 'react-hot-toast';

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

      // Modal Triggers
      openModal: (targetStep) => {
        const state = get();
        if (targetStep) {
          set({ isModalOpen: true, step: targetStep });
        } else if (state.currentPlan?.status === 'active') {
          set({ isModalOpen: true, step: 'session' });
        } else if (state.currentPlan?.status === 'completed' && state.currentPlan?.report) {
          set({ isModalOpen: true, step: 'report' });
        } else {
          set({ isModalOpen: true });
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

        set({
          selectedPlanChoice: choice,
          currentPlan: {
            mode: get().mode,
            totalHours: get().totalHours,
            subjects: get().subjects,
            meals: get().meals,
            breaks: get().breaks,
            powerNap: get().powerNap,
            beverage: get().beverage,
            plan: JSON.parse(JSON.stringify(chosenPlan)),
            altPlan: JSON.parse(JSON.stringify(altPlan)),
            status: 'draft',
          },
          step: 'edit',
        });
      },

      // Update task list in editor (drag/edit/add/remove)
      updateLocalTasks: async (newTasks, title) => {
        const { currentPlan } = get();
        if (!currentPlan) return;

        const updatedPlan = {
          ...currentPlan,
          plan: {
            ...currentPlan.plan,
            title: title !== undefined ? title : currentPlan.plan.title,
            tasks: newTasks,
          },
        };

        set({ currentPlan: updatedPlan });

        // If saved on backend, sync tasks
        if (currentPlan._id) {
          try {
            await dailyPlanService.updateTasks(currentPlan._id, newTasks, title);
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
          if (active) {
            set({ currentPlan: active });
            if (active.status === 'active') {
              set({ step: 'session' });
            }
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
      name: 'trackasap-daily-plan-storage-v2',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        mode: state.mode,
        totalHours: state.totalHours,
        subjects: state.subjects,
        meals: state.meals,
        breaks: state.breaks,
        powerNap: state.powerNap,
        beverage: state.beverage,
        isBubbleVisible: state.isBubbleVisible,
      }),
    }
  )
);

export default useDailyPlanStore;
