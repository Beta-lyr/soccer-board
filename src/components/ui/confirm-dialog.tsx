"use client";

import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmOptions {
  title?: string;
  description: string;
  confirmLabel?: string;
  variant?: "default" | "destructive";
}

/**
 * 全局确认弹窗 hook
 * 用法:
 *   const confirm = useConfirm();
 *   const ok = await confirm({ description: "确认删除？", variant: "destructive" });
 */
export function useConfirm() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions(opts);
      setResolveRef(() => resolve);
    });
  }, []);

  const handleClose = (result: boolean) => {
    resolveRef?.(result);
    setOptions(null);
    setResolveRef(null);
  };

  const ConfirmDialog = options ? (
    <Dialog open onOpenChange={() => handleClose(false)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{options.title ?? "确认操作"}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{options.description}</p>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>取消</Button>
          <Button variant={options.variant ?? "default"} onClick={() => handleClose(true)}>
            {options.confirmLabel ?? "确认"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ) : null;

  return { confirm, ConfirmDialog };
}
