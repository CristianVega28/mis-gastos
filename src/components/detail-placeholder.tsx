import { CircleAlert } from 'lucide-react-native';
import { View } from 'react-native';

import { ApiError } from '@/lib/api';
import { goBack } from '@/lib/navigation';

import { BackHeader } from './back-header';
import { ModalFrame } from './modal-frame';
import { ModalHeader } from './modal-header';
import { DetailSkeleton, FormSkeleton } from './skeletons';
import { EmptyState } from './ui/empty-state';
import { Screen } from './ui/screen';

function LoadError({ error, notFound }: { error: Error | null; notFound: string }) {
  const missing = !error || (error instanceof ApiError && error.status === 404);
  return (
    <EmptyState
      icon={CircleAlert}
      title={missing ? notFound : 'No se pudo cargar'}
      description={missing ? undefined : error.message}
      actionLabel="Volver"
      onAction={goBack}
    />
  );
}

/**
 * Lo que muestra una pantalla de detalle mientras no tiene datos: el skeleton
 * mientras carga o, si la consulta falló (no existe, sin conexión), el error y cómo salir.
 */
export function DetailPlaceholder({ error, notFound }: { error: Error | null; notFound: string }) {
  return (
    <ModalFrame size="lg">
      <Screen>
        <BackHeader />
        {error ? <LoadError error={error} notFound={notFound} /> : <DetailSkeleton />}
      </Screen>
    </ModalFrame>
  );
}

/**
 * Formulario de edición sin datos todavía: skeleton mientras carga; si falló o el
 * registro ya no existe (`missing`), el aviso con el botón para volver.
 */
export function FormPlaceholder({
  title,
  error,
  missing,
  notFound,
}: {
  title: string;
  error: Error | null;
  missing?: boolean;
  notFound: string;
}) {
  if (!error && !missing) return <FormSkeleton title={title} />;
  return (
    <ModalFrame>
      <View className="flex-1 bg-background">
        <ModalHeader title={title} />
        <LoadError error={error} notFound={notFound} />
      </View>
    </ModalFrame>
  );
}
