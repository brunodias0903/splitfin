"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import {
  createCard,
  removeCard as removeCardFromList,
} from "@/modules/cards/application/card-use-cases";
import { cardRepository } from "@/modules/cards/infrastructure/card-repository";
import type { Card } from "@/modules/cards/domain/card";
import {
  createInstallmentPlan,
  detachCard,
  payNextInstallment,
  updateInstallmentPlan,
} from "@/modules/installments/application/installment-use-cases";
import { installmentRepository } from "@/modules/installments/infrastructure/installment-repository";
import type { InstallmentData, InstallmentPlan } from "@/modules/installments/domain/installment";

interface FinanceContextValue {
  installments: InstallmentPlan[];
  cards: Card[];
  editingId: string | null;
  startEditing: (id: string | null) => void;
  cancelEditing: () => void;
  addInstallment: (data: InstallmentData) => void;
  editInstallment: (data: InstallmentData) => void;
  deleteInstallment: (id: string) => void;
  payInstallment: (id: string) => void;
  addCard: (name: string, last4: string, type: string) => void;
  removeCard: (id: string) => void;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);
const createId = () => crypto.randomUUID();

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [installments, setInstallments] = useState<InstallmentPlan[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    setInstallments(installmentRepository.load());
    setCards(cardRepository.load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) installmentRepository.save(installments);
  }, [installments, hydrated]);

  useEffect(() => {
    if (hydrated) cardRepository.save(cards);
  }, [cards, hydrated]);

  useEffect(() => {
    setEditingId(null);
  }, [pathname]);

  const addInstallment = useCallback((data: InstallmentData) => {
    const result = createInstallmentPlan(data, createId);
    setInstallments((current) => [result.plan, ...current]);
  }, []);

  const editInstallment = useCallback(
    (data: InstallmentData) => {
      if (!editingId) return;
      setInstallments((current) => updateInstallmentPlan(current, editingId, data));
      setEditingId(null);
    },
    [editingId],
  );

  const deleteInstallment = useCallback((id: string) => {
    setInstallments((current) => current.filter((plan) => plan.id !== id));
  }, []);

  const payInstallment = useCallback(
    (id: string) => {
      const target = installments.find((plan) => plan.id === id);
      if (!target) return;
      const result = payNextInstallment(target, createId);
      setInstallments((current) => current.map((plan) => (plan.id === id ? result.plan : plan)));
    },
    [installments],
  );

  const addCard = useCallback((name: string, last4: string, type: string) => {
    setCards((current) => [...current, createCard(name, last4, type, createId)]);
  }, []);

  const removeCard = useCallback((id: string) => {
    setCards((current) => removeCardFromList(current, id));
    setInstallments((current) => detachCard(current, id));
  }, []);

  const value = useMemo<FinanceContextValue>(
    () => ({
      installments,
      cards,
      editingId,
      startEditing: setEditingId,
      cancelEditing: () => setEditingId(null),
      addInstallment,
      editInstallment,
      deleteInstallment,
      payInstallment,
      addCard,
      removeCard,
    }),
    [
      installments,
      cards,
      editingId,
      addInstallment,
      editInstallment,
      deleteInstallment,
      payInstallment,
      addCard,
      removeCard,
    ],
  );

  return <FinanceContext value={value}>{children}</FinanceContext>;
}

export function useFinance(): FinanceContextValue {
  const context = useContext(FinanceContext);
  if (!context) throw new Error("useFinance must be used inside FinanceProvider");
  return context;
}
