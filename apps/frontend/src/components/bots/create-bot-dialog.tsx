'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { botsApi } from '@/lib/api/bots';

const createBotSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  phoneNumber: z.string().regex(/^628\d{8,11}$/, 'Format: 628123456789'),
});

type CreateBotFormData = z.infer<typeof createBotSchema>;

interface CreateBotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateBotDialog({ open, onOpenChange }: CreateBotDialogProps) {
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateBotFormData>({
    resolver: zodResolver(createBotSchema),
  });

  const mutation = useMutation({
    mutationFn: botsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bots'] });
      reset();
      onOpenChange(false);
    },
    onError: (err: unknown) => {
      if (err instanceof Error) {
        setError(err.message || 'Gagal membuat bot');
      } else {
        setError('Gagal membuat bot');
      }
    },
  });

  const onSubmit = (data: CreateBotFormData) => {
    setError('');
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buat Bot Baru</DialogTitle>
          <DialogDescription>
            Buat bot WhatsApp baru untuk mulai mengotomasi percakapan Anda
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Bot</Label>
            <Input
              id="name"
              placeholder="Customer Service Bot"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Nomor WhatsApp</Label>
            <Input
              id="phoneNumber"
              placeholder="628123456789"
              {...register('phoneNumber')}
            />
            {errors.phoneNumber && (
              <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Format: 628xxxxxxxxx (tanpa +, spasi, atau tanda)
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Batal
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Buat Bot
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
